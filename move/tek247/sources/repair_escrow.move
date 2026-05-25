module tek247::repair_escrow {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};

    /// Error codes
    const EInsufficientBalance: u64 = 1;
    const ERepairNotPending: u64 = 2;

    /// Admin capability to manage the repair system
    public struct AdminCap has key, store {
        id: UID
    }

    /// The Escrow object for a specific repair job
    public struct RepairEscrow has key {
        id: UID,
        customer: address,
        repair_id: u64, // Links to the DB repair ID
        balance: Balance<SUI>,
        status: u8 // 0: Pending, 1: Completed, 2: Cancelled
    }

    /// Initialize the module with an AdminCap
    fun init(ctx: &mut TxContext) {
        let admin_cap = AdminCap {
            id: object::new(ctx)
        };
        transfer::transfer(admin_cap, ctx.sender());
    }

    /// Customer creates an escrow by depositing SUI
    public fun create_escrow(
        payment: Coin<SUI>,
        repair_id: u64,
        ctx: &mut TxContext
    ) {
        let customer = ctx.sender();
        let amount = coin::value(&payment);
        assert!(amount > 0, EInsufficientBalance);

        let escrow = RepairEscrow {
            id: object::new(ctx),
            customer,
            repair_id,
            balance: coin::into_balance(payment),
            status: 0
        };

        transfer::share_object(escrow);
    }

    /// Admin completes the repair and claims the funds
    /// Returns the Coin<SUI> to the caller (admin)
    public fun complete_repair(
        _: &AdminCap,
        escrow: &mut RepairEscrow,
        ctx: &mut TxContext
    ): Coin<SUI> {
        assert!(escrow.status == 0, ERepairNotPending);
        
        escrow.status = 1;
        coin::from_balance(balance::withdraw_all(&mut escrow.balance), ctx)
    }

    /// Admin cancels the repair and refunds the customer
    /// Returns the Coin<SUI> to the caller to be sent back to the customer
    public fun cancel_repair(
        _: &AdminCap,
        escrow: &mut RepairEscrow,
        ctx: &mut TxContext
    ): Coin<SUI> {
        assert!(escrow.status == 0, ERepairNotPending);

        escrow.status = 2;
        coin::from_balance(balance::withdraw_all(&mut escrow.balance), ctx)
    }

    /// Helper to get the customer address for refunding
    public fun customer(escrow: &RepairEscrow): address {
        escrow.customer
    }
}
