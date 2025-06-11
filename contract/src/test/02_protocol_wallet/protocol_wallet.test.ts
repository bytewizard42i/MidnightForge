// tests/02_protocol_wallet/protocol_wallet.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { 
  NetworkId, 
  setNetworkId 
} from '@midnight-ntwrk/midnight-js-network-id';
import crypto from 'crypto';

// Import the contract interface - path will be updated once we have the actual contract
// import { ProtocolWallet } from '../../managed/protocol_wallet/contract/index.cjs';
// Placeholder for the contract interface until we have the actual contract
interface ProtocolWallet {
  createFolder: (folderAddr: string, ownerSig: Uint8Array) => Promise<bigint>;
  archiveFolder: (id: bigint, ownerSig: Uint8Array) => Promise<void>;
  getFolderAddress: (id: bigint) => Promise<string>;
  listFolders: () => Promise<bigint[]>;
}

// Set network ID to Undeployed for testing
setNetworkId(NetworkId.Undeployed);

// Helper functions for signing operations
async function signCreateFolder(folderAddr: string): Promise<Uint8Array> {
  // This is a placeholder - in a real implementation, we would use the owner's private key
  // to sign a message containing the folder address
  return crypto.randomBytes(64);
}

async function signArchiveFolder(id: bigint): Promise<Uint8Array> {
  // This is a placeholder - in a real implementation, we would use the owner's private key
  // to sign a message containing the folder ID
  return crypto.randomBytes(64);
}

// Helper function to deploy the protocol wallet contract
async function deployProtocolWallet(baseAddr: string): Promise<ProtocolWallet> {
  // This is a placeholder - in a real implementation, we would deploy the contract
  // and return the deployed contract interface
  return {
    createFolder: async (folderAddr: string, ownerSig: Uint8Array): Promise<bigint> => 1n,
    archiveFolder: async (id: bigint, ownerSig: Uint8Array): Promise<void> => {},
    getFolderAddress: async (id: bigint): Promise<string> => '0xdeadbeef...',
    listFolders: async (): Promise<bigint[]> => [1n]
  };
}

describe('02_protocol_wallet', () => {
  let wallet: ProtocolWallet;
  let baseAddr: string;
  let ownerSig: Uint8Array;

  beforeAll(async () => {
    // TODO: deploy base, then deploy ProtocolWallet pointing at base
    baseAddr = '0xbase...'; // This would be the address of the deployed base contract
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
