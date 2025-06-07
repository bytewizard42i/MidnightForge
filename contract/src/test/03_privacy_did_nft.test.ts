// tests/03_privacy_did_nft.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { DIDzNFT, CredentialType } from '../contract/src/contracts/03_privacy_did_nft/did_nft';
// import deployer/harness

describe('03_privacy_did_nft', () => {
  let nft: DIDzNFT;
  let issuerKey: Uint8Array;
  let issuerSig: Uint8Array;
  const recipient = new Uint8Array(32).fill(2);
  const metadata = new Uint8Array(64).fill(3);

  beforeAll(async () => {
    // TODO: deploy IssuerContract, register issuer, then deploy DIDzNFT
    // nft = await deployDIDzNFT();
    issuerKey = /* trusted issuer’s public key */;
  });

  it('mintCredential should produce a new NFT ID', async () => {
    issuerSig = await signMint(issuerKey, recipient, metadata, CredentialType.Immutable);
    const id = await nft.mintCredential(recipient, metadata, CredentialType.Immutable, issuerSig);
    expect(id).toBe(1n);
  });

  it('getOwner and getMetadata return correct values', async () => {
    const owner = await nft.getOwner(1n);
    expect(owner).toEqual(recipient);
    const md = await nft.getMetadata(1n);
    expect(md).toEqual(metadata);
  });
});
