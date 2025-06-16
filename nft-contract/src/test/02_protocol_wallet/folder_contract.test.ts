// tests/02_protocol_wallet/folder_contract.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { 
  NetworkId, 
  setNetworkId 
} from '../mocks/midnight-js-network-id';
import crypto from 'crypto';

// Placeholder for the contract interface until we have the actual contract
enum PermissionLevel {
  None = 0,
  Reader = 1,
  Writer = 2,
  Admin = 3
}

interface FolderContract {
  grantPermission: (userKey: Uint8Array, level: PermissionLevel, ownerKey: Uint8Array, ownerSig: Uint8Array) => Promise<void>;
  revokePermission: (userKey: Uint8Array, ownerKey: Uint8Array, ownerSig: Uint8Array) => Promise<void>;
  getPermission: (userKey: Uint8Array) => Promise<PermissionLevel>;
  getOwnerKey: () => Promise<Uint8Array>;
}

// Set network ID to Undeployed for testing
setNetworkId(NetworkId.Undeployed);

// Helper functions for signing operations
async function signGrant(
  ownerKey: Uint8Array, 
  folderId: bigint, 
  userKey: Uint8Array, 
  level: PermissionLevel
): Promise<Uint8Array> {
  // This is a placeholder - in a real implementation, we would use the owner's private key
  // to sign a message containing the folder ID, user key, and permission level
  return crypto.randomBytes(64);
}

async function signRevoke(
  ownerKey: Uint8Array, 
  folderId: bigint, 
  userKey: Uint8Array
): Promise<Uint8Array> {
  // This is a placeholder - in a real implementation, we would use the owner's private key
  // to sign a message containing the folder ID and user key
  return crypto.randomBytes(64);
}

// Helper function to deploy the folder contract
async function deployFolderContract(id: bigint, metadata: string): Promise<FolderContract> {
  // This is a placeholder - in a real implementation, we would deploy the contract
  // and return the deployed contract interface
  const ownerKey = crypto.randomBytes(32);
  const permissions = new Map<string, PermissionLevel>();
  
  return {
    grantPermission: async (
      userKey: Uint8Array, 
      level: PermissionLevel, 
      ownerKey: Uint8Array, 
      ownerSig: Uint8Array
    ): Promise<void> => {
      // In a real implementation, we would verify the signature
      permissions.set(Buffer.from(userKey).toString('hex'), level);
    },
    
    revokePermission: async (
      userKey: Uint8Array, 
      ownerKey: Uint8Array, 
      ownerSig: Uint8Array
    ): Promise<void> => {
      // In a real implementation, we would verify the signature
      permissions.set(Buffer.from(userKey).toString('hex'), PermissionLevel.None);
    },
    
    getPermission: async (userKey: Uint8Array): Promise<PermissionLevel> => {
      const userKeyStr = Buffer.from(userKey).toString('hex');
      return permissions.get(userKeyStr) || PermissionLevel.None;
    },
    
    getOwnerKey: async (): Promise<Uint8Array> => ownerKey
  };
}

describe('folder_contract', () => {
  let folder: FolderContract;
  let ownerKey: Uint8Array;
  let ownerSig: Uint8Array;
  let userKey: Uint8Array;

  beforeAll(async () => {
    // Deploy a FolderContract instance with id=1 and metadata
    folder = await deployFolderContract(1n, 'Test Folder');
    ownerKey = await folder.getOwnerKey();
    userKey = new Uint8Array(32).fill(1); // Test user key
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
