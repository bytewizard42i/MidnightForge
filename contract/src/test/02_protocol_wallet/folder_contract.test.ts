// tests/02_protocol_wallet/folder_contract.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { FolderContract, PermissionLevel } from '../../contract/src/contracts/02_protocol_wallet/folder_contract';
// import your deployer/harness

describe('folder_contract', () => {
  let folder: FolderContract;
  let ownerKey: Uint8Array;
  let ownerSig: Uint8Array;
  let userKey: Uint8Array;

  beforeAll(async () => {
    // TODO: deploy a FolderContract instance with id=1 and metadata
    // folder = await deployFolderContract(1, /* metadata */);
    ownerKey = await folder.getOwnerKey();
    // userKey = some test user
  });

  it('grantPermission by Owner should succeed', async () => {
    ownerSig = await signGrant(ownerKey, 1n, userKey, PermissionLevel.Reader);
    await folder.grantPermission(userKey, PermissionLevel.Reader, ownerKey, ownerSig);
    const level = await folder.getPermission(userKey);
    expect(level).toBe(PermissionLevel.Reader);
  });

  it('revokePermission should remove access', async () => {
    ownerSig = await signRevoke(ownerKey, 1n, userKey);
    await folder.revokePermission(userKey, ownerKey, ownerSig);
    const level = await folder.getPermission(userKey);
    expect(level).toBe(PermissionLevel.None);
  });
});
