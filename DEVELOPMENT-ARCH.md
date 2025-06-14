# DEVELOPMENT-ARCH.md

## DIDz NFT Contract Architecture

---

### 1. DID Structure and Generation

- **Format:**
  - 32-byte hash, represented as a hex string (e.g., `did:midnight:0x...`)
  - Matches the `DID` struct in the contract: `struct DID { bytes: Bytes<32>; }`

- **Generation Algorithm:**
  - Deterministic, based on the owner's address and a unique identifier (e.g., timestamp, counter, or random salt)
  - Uses SHA-256 hash function
  - **Example (TypeScript):**
    ```ts
    async function generateDID(ownerAddress: string, uniqueId: string): Promise<Uint8Array> {
      const input = `${ownerAddress}:${uniqueId}`;
      const encoder = new TextEncoder();
      const inputBytes = encoder.encode(input);
      const hashBuffer = await crypto.subtle.digest('SHA-256', inputBytes);
      return new Uint8Array(hashBuffer); // 32 bytes
    }
    ```
- **Rationale:**
  - Ensures uniqueness and reproducibility
  - Keeps private key material off-chain
  - Allows for flexible DID method support in the future

---

### 2. NFT Metadata Handling

- **Metadata Hash:**
  - The contract stores a hash of the metadata (`NFTMetadataHash`), not the metadata itself
  - Hash is computed as SHA-256 of the metadata JSON file

- **Metadata Storage:**
  - Metadata is stored off-chain, typically on IPFS or Arweave
  - The IPFS CID (Content Identifier) is derived from the file's content
  - The contract can optionally store the CID on-chain for discoverability

- **Immutability:**
  - IPFS CIDs are content-addressed and immutable
  - Storing the CID on-chain ensures the metadata cannot be changed without changing the CID

- **Example Metadata JSON:**
  ```json
  {
    "name": "DIDz NFT #1",
    "description": "A Decentralized Identifier NFT",
    "image": "ipfs://Qm.../image.png",
    "attributes": [
      { "trait_type": "Level", "value": 5 }
    ]
  }
  ```

- **Example Hashing (TypeScript):**
  ```ts
  async function generateMetadataHash(metadata: string): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const metadataBytes = encoder.encode(metadata);
    const hashBuffer = await crypto.subtle.digest('SHA-256', metadataBytes);
    return new Uint8Array(hashBuffer); // 32 bytes
  }
  ```

---

### 3. Contract Ledger State

- **Ledger Fields:**
  - `didzNFTs: Map<Field, DID>` — Maps NFT ID to owner DID
  - `nftMetadata: Map<Field, NFTMetadataHash>` — Maps NFT ID to metadata hash
  - `nftMetadataCID: Map<Field, Opaque<"string">>` — (Optional) Maps NFT ID to metadata CID (IPFS address)
  - `ownerKey: Bytes<32>` — On-chain public key of the contract owner
  - `globalCounter: Counter` — Used for unique NFT IDs and entropy
  - `ownerAddress: Bytes<32>` — The owner's public key (derived from `coinPublicKeyLegacy`), used for authorization checks in circuits like `mintDIDzNFT`.
  - `NFT` Struct: Defines the structure of a DIDz NFT, including `ownerAddress` (Bytes<32>), `metadataHash` (Bytes<32>), and `did` (Bytes<32>). This struct is returned by the `getDIDzNFTFromId` circuit.

- **Access Patterns:**
  - Circuits read/write these fields as part of minting and querying NFTs

---

### 4. Minting and Ownership Logic

- **Minting Availability**: The contract now fully supports minting of DIDz NFTs.
- **Minting Flow:**
  1. Only the contract owner can mint new NFTs (enforced by signature check)
  2. The global counter is incremented to generate a unique NFT ID
  3. The recipient DID, metadata hash, and (optionally) metadata CID are stored on-chain

- **NFT Retrieval:**
  - The `getDIDzNFT` function fetches the `NFT` struct by calling the `getDIDzNFTFromId` circuit. The actual `NFT` data is extracted from the `finalizedTxData.private.result` field of the transaction response.

- **Ownership Model:**
  - Ownership is tracked by mapping NFT ID to DID
  - Only the owner (as defined by `ownerKey`/`ownerAddress`) can mint

### 4.1. Core NFT Operations (MVP)

- **Transferability (`transferDIDzNFT`)**:
  - Allows the current owner of a DIDz NFT to transfer its ownership to a new recipient DID and associated owner address.
  - Ensures that only the authenticated current owner can initiate a transfer.

- **Metadata Updatability (`updateDIDzNFTMetadata`)**:
  - Provides a mechanism for the current owner of a DIDz NFT to update the cryptographic hash of its associated metadata.
  - This is crucial for dynamic credentials where the underlying data (and thus its hash) might change over time.

- **Burning/Revocation (`burnDIDzNFT`)**:
  - Enables the permanent removal of a DIDz NFT from the ledger.
  - Only the current owner can initiate the burning process, which removes the NFT's entries from `didzNFTs`, `nftMetadata`, and `nftToOwnerAddress` maps.
  - Essential for revoking credentials or removing outdated/invalid NFTs.

---

### API Refinements

-   **Generic State Fetching (`getContractLedgerState`)**: This function provides a reusable way to query contract states by taking a contract instance, a state mapper, and logging messages. It reduces duplication across various state retrieval functions (`getCounterLedgerState`, `getCombinedContractOwnerKey`, `getCombinedContractOwnerAddress`).
-   **Generic Display Function (`displayGenericContractValue`)**: Builds upon `getContractLedgerState` to provide a standardized way to display contract-related values. It handles the common logic for fetching and logging results, including scenarios where the contract value is not found, making display functions (`displayCounterValue`, `displayCombinedContractOwnerKey`, `displayCombinedContractOwnerAddress`) more concise and consistent.

---

### 5. Security and Privacy Considerations

- **Signature Verification:**
  - Only the contract owner can mint NFTs, enforced by checking `own_public_key().bytes == ownerAddress`

- **DID Privacy:**
  - DIDs are public, but generation is off-chain and can be privacy-preserving

- **Metadata Privacy:**
  - Only the hash (and optionally the CID) is stored on-chain
  - Actual metadata is public on IPFS, but cannot be changed without changing the CID

---

### 6. Extensibility and Future Work

- **Potential Upgrades:**
  - Support for additional DID methods
  - Further metadata versioning capabilities (beyond simple hash update)
  - More advanced transfer/ownership models
  - Enhanced privacy features (e.g., shielded metadata)

---

### 7. References

- [DID Core Spec](https://www.w3.org/TR/did-core/)
- [NFT Metadata Standards](https://docs.opensea.io/docs/metadata-standards)
- [IPFS Documentation](https://docs.ipfs.tech/)
- [Compact Language Reference](./CompactReference.txt) 