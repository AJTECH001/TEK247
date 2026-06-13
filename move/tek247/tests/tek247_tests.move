#[test_only]
module tek247::repair_escrow_tests {
    use sui::test_scenario::{Self as ts};
    use sui::coin;
    use sui::sui::SUI;
    use sui::clock;
    use tek247::repair_escrow::{Self as escrow, RepairEscrow, ArbiterCap};

    const CUSTOMER: address = @0xC;
    const SHOP: address = @0x5;
    const PLATFORM: address = @0xA;

    #[test]
    fun happy_path_milestone_release() {
        let mut sc = ts::begin(PLATFORM);
        escrow::init_for_testing(sc.ctx());

        // Customer funds a 100-unit escrow split 30/70.
        sc.next_tx(CUSTOMER);
        {
            let pay = coin::mint_for_testing<SUI>(100, sc.ctx());
            escrow::create_escrow<SUI>(pay, SHOP, 1, vector[30, 70], 10_000, sc.ctx());
        };

        // Shop submits milestone 0.
        sc.next_tx(SHOP);
        {
            let mut e = sc.take_shared<RepairEscrow<SUI>>();
            escrow::submit_milestone<SUI>(&mut e, 0, sc.ctx());
            ts::return_shared(e);
        };

        // Customer approves milestone 0 -> 30 released to shop.
        sc.next_tx(CUSTOMER);
        {
            let mut e = sc.take_shared<RepairEscrow<SUI>>();
            escrow::approve_milestone<SUI>(&mut e, 0, sc.ctx());
            assert!(escrow::released<SUI>(&e) == 30, 0);
            assert!(escrow::remaining<SUI>(&e) == 70, 1);
            ts::return_shared(e);
        };

        // Finish milestone 1 -> escrow completes.
        sc.next_tx(SHOP);
        {
            let mut e = sc.take_shared<RepairEscrow<SUI>>();
            escrow::submit_milestone<SUI>(&mut e, 1, sc.ctx());
            ts::return_shared(e);
        };
        sc.next_tx(CUSTOMER);
        {
            let mut e = sc.take_shared<RepairEscrow<SUI>>();
            escrow::approve_milestone<SUI>(&mut e, 1, sc.ctx());
            assert!(escrow::status<SUI>(&e) == 1, 2); // COMPLETED
            assert!(escrow::remaining<SUI>(&e) == 0, 3);
            ts::return_shared(e);
        };
        sc.end();
    }

    #[test]
    #[expected_failure(abort_code = escrow::ENotCustomer)]
    fun shop_cannot_approve_own_work() {
        let mut sc = ts::begin(PLATFORM);
        escrow::init_for_testing(sc.ctx());
        sc.next_tx(CUSTOMER);
        {
            let pay = coin::mint_for_testing<SUI>(100, sc.ctx());
            escrow::create_escrow<SUI>(pay, SHOP, 1, vector[100], 10_000, sc.ctx());
        };
        sc.next_tx(SHOP);
        {
            let mut e = sc.take_shared<RepairEscrow<SUI>>();
            escrow::submit_milestone<SUI>(&mut e, 0, sc.ctx());
            // Shop tries to approve its own milestone -> must abort.
            escrow::approve_milestone<SUI>(&mut e, 0, sc.ctx());
            ts::return_shared(e);
        };
        sc.end();
    }

    #[test]
    fun refund_when_shop_never_starts() {
        let mut sc = ts::begin(PLATFORM);
        escrow::init_for_testing(sc.ctx());
        let mut clk = clock::create_for_testing(sc.ctx());

        sc.next_tx(CUSTOMER);
        {
            let pay = coin::mint_for_testing<SUI>(100, sc.ctx());
            escrow::create_escrow<SUI>(pay, SHOP, 1, vector[100], 5_000, sc.ctx());
        };

        clock::set_for_testing(&mut clk, 6_000); // past deadline
        sc.next_tx(CUSTOMER);
        {
            let mut e = sc.take_shared<RepairEscrow<SUI>>();
            escrow::refund_if_unstarted<SUI>(&mut e, &clk, sc.ctx());
            assert!(escrow::status<SUI>(&e) == 2, 0); // REFUNDED
            ts::return_shared(e);
        };
        clock::destroy_for_testing(clk);
        sc.end();
    }

    #[test]
    fun arbiter_splits_disputed_escrow() {
        let mut sc = ts::begin(PLATFORM);
        escrow::init_for_testing(sc.ctx());

        sc.next_tx(CUSTOMER);
        {
            let pay = coin::mint_for_testing<SUI>(100, sc.ctx());
            escrow::create_escrow<SUI>(pay, SHOP, 1, vector[100], 10_000, sc.ctx());
        };
        sc.next_tx(CUSTOMER);
        {
            let mut e = sc.take_shared<RepairEscrow<SUI>>();
            escrow::raise_dispute<SUI>(&mut e, sc.ctx());
            ts::return_shared(e);
        };
        // Platform arbiter splits 60% to customer, 40% to shop.
        sc.next_tx(PLATFORM);
        {
            let cap = sc.take_from_sender<ArbiterCap>();
            let mut e = sc.take_shared<RepairEscrow<SUI>>();
            escrow::resolve_dispute<SUI>(&cap, &mut e, 6_000, sc.ctx());
            assert!(escrow::status<SUI>(&e) == 1, 0); // COMPLETED
            assert!(escrow::remaining<SUI>(&e) == 0, 1);
            ts::return_shared(e);
            sc.return_to_sender(cap);
        };
        sc.end();
    }
}
