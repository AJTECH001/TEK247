# TEK247 — On-chain Deployments

## Testnet (Sui Overflow 2026)

| Item | ID |
| --- | --- |
| Package ID | `0x64f7db7a66b5367947bd2a6b7e3751b0b6350dde7a12680903717a2052bff9e1` |
| ArbiterCap (escrow dispute resolution) | `0xa259366ad69332c5e0cb763ccc85b99c09e43cde8f8e6a10f152a57e3d26ad4e` |
| IssuerCap (device passport issuance) | `0xf735ea40ee482d48077150dbb3ec9cd59ca689ca576fd893eb1c994dd34e65a3` |
| UpgradeCap | `0xc13f556acc6f58c118ab747c1bed44cc8bcbb1c5826d7303640601ae49b9c61b` |
| Publish digest | `9EZF1DU3FLFJmPf5oFH7v6tmgzFK2mMsiHXSpQwjkktU` |
| Publisher / arbiter address | `0xae680876f96824ade875f6d6523ab41d08df06abefa3c187079ae72b9df21a0c` |

Explorer: https://suiscan.xyz/testnet/object/0x64f7db7a66b5367947bd2a6b7e3751b0b6350dde7a12680903717a2052bff9e1

### Modules
- `repair_escrow` — trustless milestone escrow, generic over `Coin<T>` (USDC by default).
- `device_passport` — transferable device identity with append-only, Walrus-backed repair history.

### Live demo artifacts (testnet, verified end-to-end)
- Sample Device Passport object: `0x737ffa0044e16a311e9c92b20290b8efe37fd727583315a79b0b11060cb3a8e4`
  - Holds one Walrus-backed repair record ("Screen + battery replacement").
  - Walrus report blob: `di2DBqbGhbfpQ3ZW8R00GXZBnCamNUMrJvJR6VQIuwY`
  - Aggregator URL: https://aggregator.walrus-testnet.walrus.space/v1/blobs/di2DBqbGhbfpQ3ZW8R00GXZBnCamNUMrJvJR6VQIuwY
- Walrus testnet endpoints used: publisher `https://publisher.walrus-testnet.walrus.space`, aggregator `https://aggregator.walrus-testnet.walrus.space`.

### Backend env to add
```
SUI_PACKAGE_ID=0x64f7db7a66b5367947bd2a6b7e3751b0b6350dde7a12680903717a2052bff9e1
SUI_ARBITER_CAP_ID=0xa259366ad69332c5e0cb763ccc85b99c09e43cde8f8e6a10f152a57e3d26ad4e
SUI_ISSUER_CAP_ID=0xf735ea40ee482d48077150dbb3ec9cd59ca689ca576fd893eb1c994dd34e65a3
```
