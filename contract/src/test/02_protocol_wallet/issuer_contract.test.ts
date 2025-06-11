// tests/02_protocol_wallet/issuer_contract.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { 
  NetworkId, 
  setNetworkId 
} from '../mocks/midnight-js-network-id';
import crypto from 'crypto';

// Placeholder for the contract interface until we have the actual contract
interface IssuerContract {
  addIssuer: (issuerKey: Uint8Array, ownerSig: Uint8Array) => Promise<void>;
  revokeIssuer: (issuerKey: Uint8Array, ownerSig: Uint8Array) => Promise<void>;
  isTrustedIssuer: (issuerKey: Uint8Array) => Promise<boolean>;
  getOwnerKey: () => Promise<Uint8Array>;
}

// Set network ID to Undeployed for testing
setNetworkId(NetworkId.Undeployed);

// Helper function for signing operations
async function signIssuerOp(
  ownerKey: Uint8Array, 
  issuerKey: Uint8Array
): Promise<Uint8Array> {
  // This is a placeholder - in a real implementation, we would use the owner's private key
  // to sign a message containing the issuer key
  return crypto.randomBytes(64);
}

// Helper function to deploy the issuer contract
async function deployIssuerContract(): Promise<IssuerContract> {
  // This is a placeholder - in a real implementation, we would deploy the contract
  // and return the deployed contract interface
  const ownerKey = crypto.randomBytes(32);
  let trustedIssuers = new Set<string>();
  
  return {
    addIssuer: async (issuerKey: Uint8Array, ownerSig: Uint8Array): Promise<void> => {
      // In a real implementation, we would verify the signature
      trustedIssuers.add(Buffer.from(issuerKey).toString('hex'));
    },
    
    revokeIssuer: async (issuerKey: Uint8Array, ownerSig: Uint8Array): Promise<void> => {
      // In a real implementation, we would verify the signature
      trustedIssuers.delete(Buffer.from(issuerKey).toString('hex'));
    },
    
    isTrustedIssuer: async (issuerKey: Uint8Array): Promise<boolean> => {
      return trustedIssuers.has(Buffer.from(issuerKey).toString('hex'));
    },
    
    getOwnerKey: async (): Promise<Uint8Array> => ownerKey
  };
}

describe('issuer_contract', () => {
  let issuerCtr: IssuerContract;
  let ownerKey: Uint8Array;
  let ownerSig: Uint8Array;
  const testIssuer = new Uint8Array(32).fill(1);

  beforeAll(async () => {
    // Deploy the IssuerContract
    issuerCtr = await deployIssuerContract();
    ownerKey = await issuerCtr.getOwnerKey();
  });

  it('addIssuer should mark a key as trusted', async () => {
    ownerSig = await signIssuerOp(ownerKey, testIssuer);
    await issuerCtr.addIssuer(testIssuer, ownerSig);
    const trusted = await issuerCtr.isTrustedIssuer(testIssuer);
    expect(trusted).toBe(true);
  });

  it('revokeIssuer should unmark a key', async () => {
    ownerSig = await signIssuerOp(ownerKey, testIssuer);
    await issuerCtr.revokeIssuer(testIssuer, ownerSig);
    const trusted = await issuerCtr.isTrustedIssuer(testIssuer);
    expect(trusted).toBe(false);
  });
});
