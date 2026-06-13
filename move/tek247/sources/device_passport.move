/// TEK247 — On-chain Device Passport.
///
/// A transferable identity object for a physical device (laptop). It carries an
/// append-only history of repair records. Heavy artifacts (diagnostic report PDF,
/// photos) live on Walrus; the passport stores only the Walrus blob id plus a
/// content hash, so history is verifiable and tamper-evident.
///
/// On resale the passport transfers to the new owner, but the repair history can
/// never be deleted or rewritten — killing the counterfeit-spec / stolen-device
/// fraud common in second-hand markets.
module tek247::device_passport {
    use std::string::String;
    use sui::event;

    /// Capability held by the platform / authorized repair shops to issue passports
    /// and append verified repair records.
    public struct IssuerCap has key, store { id: UID }

    public struct RepairRecord has store, copy, drop {
        shop: address,
        summary: String,        // short human label, e.g. "Screen + battery replacement"
        walrus_blob_id: String, // Walrus blob holding the full report + photos
        content_hash: vector<u8>, // hash of the off-chain artifact for integrity
        timestamp_ms: u64,
    }

    public struct DevicePassport has key, store {
        id: UID,
        serial_hash: vector<u8>, // hash of the device serial; not the raw serial
        brand: String,
        model: String,
        issued_by: address,
        records: vector<RepairRecord>,
    }

    public struct PassportIssued has copy, drop {
        passport_id: ID, serial_hash: vector<u8>, owner: address,
    }
    public struct RepairRecorded has copy, drop {
        passport_id: ID, shop: address, walrus_blob_id: String, index: u64,
    }

    fun init(ctx: &mut TxContext) {
        transfer::public_transfer(IssuerCap { id: object::new(ctx) }, ctx.sender());
    }

    /// Issue a passport for a device and transfer it to `owner`.
    public fun issue(
        _: &IssuerCap,
        serial_hash: vector<u8>,
        brand: String,
        model: String,
        owner: address,
        ctx: &mut TxContext,
    ) {
        let passport = DevicePassport {
            id: object::new(ctx),
            serial_hash,
            brand,
            model,
            issued_by: ctx.sender(),
            records: vector<RepairRecord>[],
        };
        event::emit(PassportIssued {
            passport_id: object::id(&passport), serial_hash: passport.serial_hash, owner,
        });
        transfer::public_transfer(passport, owner);
    }

    /// Append a verified repair record. Requires the platform/shop IssuerCap so a
    /// random party cannot forge history; history is append-only by construction.
    public fun add_repair_record(
        _: &IssuerCap,
        passport: &mut DevicePassport,
        summary: String,
        walrus_blob_id: String,
        content_hash: vector<u8>,
        clock: &sui::clock::Clock,
        ctx: &TxContext,
    ) {
        let record = RepairRecord {
            shop: ctx.sender(),
            summary,
            walrus_blob_id,
            content_hash,
            timestamp_ms: clock.timestamp_ms(),
        };
        vector::push_back(&mut passport.records, record);
        event::emit(RepairRecorded {
            passport_id: object::id(passport),
            shop: ctx.sender(),
            walrus_blob_id,
            index: vector::length(&passport.records) - 1,
        });
    }

    // ===== Views =====
    public fun record_count(p: &DevicePassport): u64 { vector::length(&p.records) }
    public fun issued_by(p: &DevicePassport): address { p.issued_by }
    public fun serial_hash(p: &DevicePassport): vector<u8> { p.serial_hash }
}
