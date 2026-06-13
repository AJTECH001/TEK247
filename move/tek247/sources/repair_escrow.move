/// TEK247 — Trustless repair & resale escrow.
///
/// Funds are locked in a shared object and released milestone-by-milestone only
/// on the customer's approval. Neither side can unilaterally take the money:
///   - the shop releases work for approval (`submit_milestone`)
///   - the customer approves and releases payment (`approve_milestone`)
///   - if the customer ghosts past the deadline, the shop can claim a *submitted*
///     milestone (`claim_submitted_after_deadline`)
///   - if the shop never starts past the deadline, the customer reclaims all funds
///     (`refund_if_unstarted`)
///   - either party can freeze the escrow with `raise_dispute`; the platform
///     `ArbiterCap` can then ONLY split a *disputed* escrow — it has no power over
///     a healthy one.
module tek247::repair_escrow {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::clock::Clock;
    use sui::event;

    // ===== Errors =====
    const ENotCustomer: u64 = 0;
    const ENotShop: u64 = 1;
    const EBadMilestoneSum: u64 = 2;
    const EBadIndex: u64 = 3;
    const EMilestoneNotPending: u64 = 4;
    const EMilestoneNotSubmitted: u64 = 5;
    const EEscrowNotActive: u64 = 6;
    const EDeadlineNotPassed: u64 = 7;
    const EWorkAlreadyStarted: u64 = 8;
    const ENotDisputed: u64 = 9;
    const EBadSplit: u64 = 10;
    const EEmptyMilestones: u64 = 11;
    const EZeroAmount: u64 = 12;
    const ENotParty: u64 = 13;

    // ===== Milestone status =====
    const M_PENDING: u8 = 0;
    const M_SUBMITTED: u8 = 1;
    const M_RELEASED: u8 = 2;

    // ===== Escrow status =====
    const S_ACTIVE: u8 = 0;
    const S_COMPLETED: u8 = 1;
    const S_REFUNDED: u8 = 2;
    const S_DISPUTED: u8 = 3;

    const BPS_DENOM: u64 = 10_000;

    /// Platform arbiter capability. Its ONLY power is to split a *disputed* escrow.
    /// It cannot touch a healthy escrow. Minted once to the publisher at init.
    public struct ArbiterCap has key, store { id: UID }

    public struct Milestone has store, copy, drop {
        amount: u64,
        status: u8,
    }

    /// Trustless repair escrow, generic over the payment coin type `T` (e.g. USDC).
    public struct RepairEscrow<phantom T> has key {
        id: UID,
        customer: address,
        shop: address,
        repair_id: u64,       // off-chain reference only
        balance: Balance<T>,
        milestones: vector<Milestone>,
        released: u64,
        deadline_ms: u64,     // absolute ms; protects both parties against inactivity
        status: u8,
    }

    // ===== Events (indexed off-chain to mirror state into the UI) =====
    public struct EscrowCreated has copy, drop {
        escrow_id: ID, customer: address, shop: address, repair_id: u64, total: u64, milestones: u64,
    }
    public struct MilestoneSubmitted has copy, drop { escrow_id: ID, index: u64 }
    public struct MilestoneReleased has copy, drop { escrow_id: ID, index: u64, amount: u64, to: address }
    public struct EscrowRefunded has copy, drop { escrow_id: ID, amount: u64, to: address }
    public struct DisputeRaised has copy, drop { escrow_id: ID, by: address }
    public struct DisputeResolved has copy, drop { escrow_id: ID, to_customer: u64, to_shop: u64 }
    public struct EscrowCompleted has copy, drop { escrow_id: ID }

    fun init(ctx: &mut TxContext) {
        transfer::public_transfer(ArbiterCap { id: object::new(ctx) }, ctx.sender());
    }

    /// Customer (the sender) deposits `payment` and defines the milestone split.
    /// The milestone amounts must sum exactly to the deposited amount.
    public fun create_escrow<T>(
        payment: Coin<T>,
        shop: address,
        repair_id: u64,
        milestone_amounts: vector<u64>,
        deadline_ms: u64,
        ctx: &mut TxContext,
    ) {
        let n = vector::length(&milestone_amounts);
        assert!(n > 0, EEmptyMilestones);

        let total = coin::value(&payment);
        assert!(total > 0, EZeroAmount);

        let mut sum = 0u64;
        let mut milestones = vector<Milestone>[];
        let mut i = 0;
        while (i < n) {
            let amt = *vector::borrow(&milestone_amounts, i);
            assert!(amt > 0, EZeroAmount);
            sum = sum + amt;
            vector::push_back(&mut milestones, Milestone { amount: amt, status: M_PENDING });
            i = i + 1;
        };
        assert!(sum == total, EBadMilestoneSum);

        let customer = ctx.sender();
        let escrow = RepairEscrow<T> {
            id: object::new(ctx),
            customer,
            shop,
            repair_id,
            balance: coin::into_balance(payment),
            milestones,
            released: 0,
            deadline_ms,
            status: S_ACTIVE,
        };
        event::emit(EscrowCreated {
            escrow_id: object::id(&escrow), customer, shop, repair_id, total, milestones: n,
        });
        transfer::share_object(escrow);
    }

    /// Shop marks a milestone's work as done, awaiting customer approval.
    public fun submit_milestone<T>(escrow: &mut RepairEscrow<T>, index: u64, ctx: &TxContext) {
        assert!(escrow.status == S_ACTIVE, EEscrowNotActive);
        assert!(ctx.sender() == escrow.shop, ENotShop);
        assert!(index < vector::length(&escrow.milestones), EBadIndex);
        let m = vector::borrow_mut(&mut escrow.milestones, index);
        assert!(m.status == M_PENDING, EMilestoneNotPending);
        m.status = M_SUBMITTED;
        event::emit(MilestoneSubmitted { escrow_id: object::id(escrow), index });
    }

    /// Customer approves a submitted milestone, releasing its funds to the shop.
    public fun approve_milestone<T>(escrow: &mut RepairEscrow<T>, index: u64, ctx: &mut TxContext) {
        assert!(escrow.status == S_ACTIVE, EEscrowNotActive);
        assert!(ctx.sender() == escrow.customer, ENotCustomer);
        release_internal(escrow, index, ctx);
    }

    /// Anti-griefing for the shop: if the customer never approves a *submitted*
    /// milestone before the deadline, the shop may claim it.
    public fun claim_submitted_after_deadline<T>(
        escrow: &mut RepairEscrow<T>, index: u64, clock: &Clock, ctx: &mut TxContext,
    ) {
        assert!(escrow.status == S_ACTIVE, EEscrowNotActive);
        assert!(ctx.sender() == escrow.shop, ENotShop);
        assert!(clock.timestamp_ms() >= escrow.deadline_ms, EDeadlineNotPassed);
        assert!(index < vector::length(&escrow.milestones), EBadIndex);
        assert!(vector::borrow(&escrow.milestones, index).status == M_SUBMITTED, EMilestoneNotSubmitted);
        release_internal(escrow, index, ctx);
    }

    fun release_internal<T>(escrow: &mut RepairEscrow<T>, index: u64, ctx: &mut TxContext) {
        assert!(index < vector::length(&escrow.milestones), EBadIndex);
        let m = vector::borrow_mut(&mut escrow.milestones, index);
        assert!(m.status == M_SUBMITTED, EMilestoneNotSubmitted);
        m.status = M_RELEASED;
        let amount = m.amount;

        let shop = escrow.shop;
        let coin_out = coin::from_balance(balance::split(&mut escrow.balance, amount), ctx);
        transfer::public_transfer(coin_out, shop);
        escrow.released = escrow.released + amount;
        event::emit(MilestoneReleased { escrow_id: object::id(escrow), index, amount, to: shop });
        maybe_complete(escrow);
    }

    fun maybe_complete<T>(escrow: &mut RepairEscrow<T>) {
        if (balance::value(&escrow.balance) == 0) {
            escrow.status = S_COMPLETED;
            event::emit(EscrowCompleted { escrow_id: object::id(escrow) });
        }
    }

    /// Anti-nonperformance for the customer: if the shop never submits any
    /// milestone before the deadline, the customer reclaims all remaining funds.
    public fun refund_if_unstarted<T>(escrow: &mut RepairEscrow<T>, clock: &Clock, ctx: &mut TxContext) {
        assert!(escrow.status == S_ACTIVE, EEscrowNotActive);
        assert!(ctx.sender() == escrow.customer, ENotCustomer);
        assert!(clock.timestamp_ms() >= escrow.deadline_ms, EDeadlineNotPassed);
        let n = vector::length(&escrow.milestones);
        let mut i = 0;
        while (i < n) {
            assert!(vector::borrow(&escrow.milestones, i).status == M_PENDING, EWorkAlreadyStarted);
            i = i + 1;
        };
        let amount = balance::value(&escrow.balance);
        let customer = escrow.customer;
        let coin_out = coin::from_balance(balance::withdraw_all(&mut escrow.balance), ctx);
        transfer::public_transfer(coin_out, customer);
        escrow.status = S_REFUNDED;
        event::emit(EscrowRefunded { escrow_id: object::id(escrow), amount, to: customer });
    }

    /// Either party can freeze the escrow into a dispute.
    public fun raise_dispute<T>(escrow: &mut RepairEscrow<T>, ctx: &TxContext) {
        assert!(escrow.status == S_ACTIVE, EEscrowNotActive);
        let s = ctx.sender();
        assert!(s == escrow.customer || s == escrow.shop, ENotParty);
        escrow.status = S_DISPUTED;
        event::emit(DisputeRaised { escrow_id: object::id(escrow), by: s });
    }

    /// Arbiter resolves a dispute by splitting the *remaining* balance. This is the
    /// arbiter's only privileged action and only works on a disputed escrow.
    public fun resolve_dispute<T>(
        _: &ArbiterCap,
        escrow: &mut RepairEscrow<T>,
        customer_bps: u64,
        ctx: &mut TxContext,
    ) {
        assert!(escrow.status == S_DISPUTED, ENotDisputed);
        assert!(customer_bps <= BPS_DENOM, EBadSplit);

        let remaining = balance::value(&escrow.balance);
        let prod = (remaining as u128) * (customer_bps as u128);
        let to_customer = (prod / (BPS_DENOM as u128)) as u64;
        let to_shop = remaining - to_customer;

        let escrow_id = object::id(escrow);
        if (to_customer > 0) {
            let c = coin::from_balance(balance::split(&mut escrow.balance, to_customer), ctx);
            transfer::public_transfer(c, escrow.customer);
        };
        if (to_shop > 0) {
            let c = coin::from_balance(balance::withdraw_all(&mut escrow.balance), ctx);
            transfer::public_transfer(c, escrow.shop);
        };
        escrow.status = S_COMPLETED;
        event::emit(DisputeResolved { escrow_id, to_customer, to_shop });
    }

    // ===== Views =====
    public fun status<T>(e: &RepairEscrow<T>): u8 { e.status }
    public fun released<T>(e: &RepairEscrow<T>): u64 { e.released }
    public fun remaining<T>(e: &RepairEscrow<T>): u64 { balance::value(&e.balance) }
    public fun customer<T>(e: &RepairEscrow<T>): address { e.customer }
    public fun shop<T>(e: &RepairEscrow<T>): address { e.shop }
    public fun milestone_count<T>(e: &RepairEscrow<T>): u64 { vector::length(&e.milestones) }
    public fun milestone_status<T>(e: &RepairEscrow<T>, i: u64): u8 { vector::borrow(&e.milestones, i).status }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) { init(ctx); }
}
