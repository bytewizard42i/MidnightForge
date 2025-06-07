// tests/02_protocol_wallet/issuer_contract.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { IssuerContract } from '../../contract/src/contracts/02_protocol_wallet/issuer_contract';
// import deployer/harness

describe('issuer_contract', () => {
  let issuerCtr: IssuerContract;
  let ownerKey: Uint8Array;
  let ownerSig: Uint8Array;
  const testIssuer = new Uint8Array(32).fill(1);

  beforeAll(async () => {
    // TODO: deploy IssuerContract
    // issuerCtr = await deployIssuerContract();
    ownerKey = /* your owner public key */;
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
