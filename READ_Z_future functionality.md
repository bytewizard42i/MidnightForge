# Implementation Guidelines

## 1. Folder Metadata Updates Circuit (`updateFolderMetadata`)
- **Purpose**: Allow authorized users (Owner or Admin) to modify a folder’s metadata (e.g. name, description).
- **Circuit Signature**:
  ```compact
  export circuit updateFolderMetadata(
      folderId: Field,
      newMetadata: Bytes<64>,
      callerKey: Bytes<32>,
      signature: Bytes<64>
  ) { ... }

Steps:

Message construction

compact
Copy code
let msg = persistent_hash<Vector<3, Bytes<32>>>([
  pad(32, "midnight:protocol:updateMetadata"),
  folderId as Bytes<32>,
  newMetadata
]);
Signature verification

compact
Copy code
assert verifySignature(base.getOwnerKey(), signature, msg)
    "ERR_SIG: invalid updateMetadata signature";
State checks

Ensure folderStatus[folderId] != FolderStatus.Deleted.

Optionally require folderStatus[folderId] == Active.

State update

compact
Copy code
folderMetadata[folderId] = newMetadata;
Emit event/log

compact
Copy code
emit Log("MetadataUpdated", [folderId as Bytes<32>]);



2. Lock/Unlock/Delete Folder Operations
Extend your enum:

compact
Copy code
enum FolderStatus { Active, Archived, Locked, Deleted }
lockFolder / unlockFolder

compact
Copy code
export circuit lockFolder(folderId: Field, signature: Bytes<64>) { ... }
export circuit unlockFolder(folderId: Field, signature: Bytes<64>) { ... }
Domain‐separated messages: "lockFolder" / "unlockFolder".

Preconditions:

lockFolder: status ∈ {Active, Archived} → Locked

unlockFolder: status == Locked → Active

Update folderStatus[...].

Emit FolderLocked / FolderUnlocked logs.

deleteFolder

compact
Copy code
export circuit deleteFolder(folderId: Field, signature: Bytes<64>) { ... }
Only when status == Locked.

Remove entries or set status = Deleted.

Emit FolderDeleted log.

To add lock, unlock, and deleteFolder semantics into your protocol_wallet.compact, you can introduce two new circuits (and a Deleted state if you want full on-chain removal). Below is a self-contained snippet showing:

Extending your FolderStatus enum

lockFolder / unlockFolder circuits

deleteFolder circuit that wipes out the folder mappings

Add this into /contracts/02_protocol_wallet/protocol_wallet.compact alongside your existing circuits:

diff
Copy code
--- a/contracts/02_protocol_wallet/protocol_wallet.compact
+++ b/contracts/02_protocol_wallet/protocol_wallet.compact
@@
// ----------------------------------------
// === Types & Enums ===
// ----------------------------------------

-enum FolderStatus { Active, Archived, Locked }
+// Deleted = fully removed; Locked = frozen (no actions)
+enum FolderStatus { Active, Archived, Locked, Deleted }

@@
// ----------------------------------------
// === Circuit: archiveFolder() ===
// ----------------------------------------

// (existing code here)

@@
// ----------------------------------------
// === Circuit: lockFolder() ===
// ----------------------------------------

/*
 * export circuit lockFolder
 * -----------------------------------------------------------------------
 * Freezes a folder; no create/archive or folder‐level actions allowed.
 *
 * Params:
 *   folderId       – Field identifier
 *   ownerSignature – Bytes<64> signature by base.ownerKey over the message
 */
export circuit lockFolder(
    folderId: Field,
    ownerSignature: Bytes<64>
) {
    // Domain tag + folderId
    let msg = persistent_hash<Vector<2, Bytes<32>>>([
        pad(32, "midnight:protocol:lockFolder"),
        folderId as Bytes<32>
    ]);

    // Only owner can lock
    assert verifySignature(base.getOwnerKey(), ownerSignature, msg)
        "ERR_SIG: invalid lockFolder signature";

    // Must be Active or Archived to lock
    let status = folderStatus[folderId];
    assert (status == FolderStatus.Active || status == FolderStatus.Archived)
        "ERR_STATE: must be Active/Archived to lock";

    folderStatus[folderId] = FolderStatus.Locked;
}

@@
// ----------------------------------------
// === Circuit: unlockFolder() ===
// ----------------------------------------

/*
 * export circuit unlockFolder
 * -----------------------------------------------------------------------
 * Unfreezes a folder back to Active.
 *
 * Params:
 *   folderId       – Field identifier
 *   ownerSignature – Bytes<64> signature by base.ownerKey over the message
 */
export circuit unlockFolder(
    folderId: Field,
    ownerSignature: Bytes<64>
) {
    let msg = persistent_hash<Vector<2, Bytes<32>>>([
        pad(32, "midnight:protocol:unlockFolder"),
        folderId as Bytes<32>
    ]);

    assert verifySignature(base.getOwnerKey(), ownerSignature, msg)
        "ERR_SIG: invalid unlockFolder signature";

    // Only Locked folders can be unlocked
    assert folderStatus[folderId] == FolderStatus.Locked
        "ERR_STATE: only Locked folders can be unlocked";

    folderStatus[folderId] = FolderStatus.Active;
}

@@
// ----------------------------------------
// === Circuit: deleteFolder() ===
// ----------------------------------------

/*
 * export circuit deleteFolder
 * -----------------------------------------------------------------------
 * Permanently removes a folder from the registry.
 * Only callable when folder is Locked.
 *
 * Params:
 *   folderId       – Field identifier
 *   ownerSignature – Bytes<64> signature by base.ownerKey over the message
 */
export circuit deleteFolder(
    folderId: Field,
    ownerSignature: Bytes<64>
) {
    let msg = persistent_hash<Vector<2, Bytes<32>>>([
        pad(32, "midnight:protocol:deleteFolder"),
        folderId as Bytes<32>
    ]);

    assert verifySignature(base.getOwnerKey(), ownerSignature, msg)
        "ERR_SIG: invalid deleteFolder signature";

    // Only Locked folders can be deleted
    assert folderStatus[folderId] == FolderStatus.Locked
        "ERR_STATE: only Locked folders can be deleted";

    // Remove from registry maps
    folderRegistry.remove(folderId);
    folderStatus.remove(folderId);
}
How it works

lockFolder & unlockFolder toggle between Active/Archived ↔ Locked, preventing other circuits from acting on a locked folder.

deleteFolder only succeeds on a Locked folder—this avoids accidental removals. It uses map.remove(key) to purge both address and status.

Every circuit uses a domain-separated hash (persistent_hash) plus owner signature to prevent replay or unauthorized calls.

Tip: If your version of Compact doesn’t support map.remove(), you can instead set folderStatus to a Deleted variant and ignore entries whose status is Deleted in your front-end or indexing logic.


3. Events/Logs for Off-chain Indexers
Why: Indexers listen for on-chain events to maintain up-to-date off-chain state.

How: Inside each circuit, add:

compact
Copy code
emit Log("<EventName>", [parameter1, parameter2, ...]);
Suggested events:

FolderCreated(folderId)

FolderArchived(folderId)

FolderLocked(folderId)

MetadataUpdated(folderId)

PermissionGranted(folderId, userKey, level)

IssuerAdded(issuerKey)

CredentialMinted(nftId, didPk)




4. Edge-Case Tests
Archiving non-existent folder

ts
Copy code
await expect(archiveFolder(999, sig))
  .rejects.toThrow("ERR_STATE");
Revoking unregistered issuer

ts
Copy code
await expect(revokeIssuer(unknownKey, sig))
  .rejects.toThrow("ERR_NOT_FOUND");
Double-minting

Call mintCredential(...) twice with the same DID & metadata; ensure nftId increments correctly and no collisions.

Replay attacks

Reuse a valid signature on a different folderId or userKey; expect ERR_SIG.



5. Client-Side Error Handling
Map error prefixes to messages:

ts
Copy code
const ERROR_MAP = {
  "ERR_SIG":       "Signature verification failed. Please re-authenticate.",
  "ERR_STATE":     "This folder is in an invalid state for that operation.",
  "ERR_NOT_FOUND": "Requested item not found. It may have been deleted.",
  // …
};
UI display:

ts
Copy code
try {
  await contract.createFolder(...);
} catch (e) {
  const code = e.message.split(":")[0];
  alert(ERROR_MAP[code] || "Unexpected error");
}
6. Contract Versioning & Migration
On-chain version variable:

compact
Copy code
export ledger contractVersion: Field;
constructor(...) {
  contractVersion = 1;
  // …
}
Upgrade path:

Deploy v2 contract with contractVersion = 2.

Run migration script:

Read state from v1 via off-chain calls.

Initialize v2’s state accordingly.

Emit ContractUpgraded(1, 2) in v2 constructor or a dedicated circuit.

Off-chain: SDK checks contractVersion and warns if incompatible

MidnightForge/
├── contract/
│   └── src/
│       ├── contracts/
│       │   ├── 01_protocol_wallet_base/
│       │   │   └── protocol_wallet_base.compact
│       │   ├── 02_protocol_wallet/
│       │   │   ├── protocol_wallet.compact
│       │   │   ├── folder_contract.compact
│       │   │   └── issuer_contract.compact
│       │   └── 03_privacy_did_nft/
│       │       └── did_nft.compact
│       ├── index.ts
│       └── witnesses.ts
│
├── tests/                                ← root‐level Vitest suites
│   ├── 01_protocol_wallet_base.test.ts   ← tests for protocol_wallet_base
│   │
│   ├── 02_protocol_wallet/               ← tests for protocol_wallet layer
│   │   ├── protocol_wallet.test.ts
│   │   ├── folder_contract.test.ts
│   │   └── issuer_contract.test.ts
│   │
│   └── 03_privacy_did_nft.test.ts        ← tests for DIDz NFT contract
│
├── bots/
├── ai-engine/
├── examples/
├── scripts/
├── package.json
├── tsconfig.json
└── README.md
