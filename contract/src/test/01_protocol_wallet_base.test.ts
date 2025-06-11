// tests/01_protocol_wallet_base.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import crypto from 'crypto';
import { 
  createTestingEnvironment, 
  TestEnvironment 
} from './mocks/midnight-js-testing';
import { 
  NetworkId, 
  setNetworkId 
} from './mocks/midnight-js-network-id';

// Set network ID to Undeployed for testing
setNetworkId(NetworkId.Undeployed);

describe('01_protocol_wallet_base', () => {
  let env: TestEnvironment;
  let base: any;            // will hold the deployed circuits
  let sk: Uint8Array;

  beforeAll(async () => {
    // 1. Spin up Midnight's test environment
    env = await createTestingEnvironment();

    // 2. Generate a random 32-byte secret key for our wallet owner
    sk = crypto.randomBytes(32);

    // 3. Deploy the protocol_wallet_base contract
    //    The name 'protocol_wallet_base' should match your contract ID in mesh.js
    const deployed = await env.wallet.deployContract('protocol_wallet_base', { sk });
    
    // 4. Grab the exported circuits for testing
    base = deployed.circuits;
  });

  afterAll(async () => {
    // Tear down the test environment (cleanup providers, nodes, etc.)
    await env.teardown();
  });

  it('initial counter should be 0', async () => {
    const cnt = await base.getCounter();
    expect(cnt).toBe(0n);
  });

  it('incrementCounter should increase the counter sequentially', async () => {
    const first = await base.incrementCounter();
    expect(first).toBe(1n);
    const second = await base.incrementCounter();
    expect(second).toBe(2n);
  });

  it('getOwnerKey should return a 32-byte public key', async () => {
    const pk = await base.getOwnerKey();
    expect(pk).toBeInstanceOf(Uint8Array);
    expect(pk.length).toBe(32);
  });
});
