// tests/02_protocol_wallet/protocol_wallet.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { ProtocolWallet } from '../../contract/src/contracts/02_protocol_wallet/protocol_wallet';
// import your test-harness/deployer/helpers here

describe('02_protocol_wallet', () => {
  let wallet: ProtocolWallet;
  let baseAddr: string;
  let ownerSig: Uint8Array;

  beforeAll(async () => {
    // TODO: deploy base, then deploy ProtocolWallet pointing at base
    // baseAddr = ...
    // ownerSig = signMessage(baseOwnerKey, /* createFolder message */)
    wallet = await deployProtocolWallet(baseAddr);
  });

  it('createFolder should register a new folder', async () => {
    const folderAddr = '0xdeadbeef...'; // dummy contract address
    ownerSig = await signCreateFolder(folderAddr);
    const id = await wallet.createFolder(folderAddr, ownerSig);
    expect(id).toBeGreaterThan(0n);
    const stored = await wallet.getFolderAddress(id);
    expect(stored).toBe(folderAddr);
  });

  it('archiveFolder should update status correctly', async () => {
    const id = 1n;
    ownerSig = await signArchiveFolder(id);
    await wallet.archiveFolder(id, ownerSig);
    const list = await wallet.listFolders();
    expect(list).toContain(id);
  });

  it('listFolders returns sequential IDs', async () => {
    const ids = await wallet.listFolders();
    expect(ids).toEqual([1n]);
  });
});
