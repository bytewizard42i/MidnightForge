// Mock implementation of @midnight-ntwrk/midnight-js-testing
// This provides the necessary types and functions for testing without requiring the actual package

import crypto from 'crypto';

// Define the TestEnvironment interface
export interface TestEnvironment {
  wallet: {
    deployContract: (contractName: string, options?: any) => Promise<{
      circuits: any;
      address: string;
    }>;
  };
  teardown: () => Promise<void>;
}

// Create a mock testing environment
export async function createTestingEnvironment(): Promise<TestEnvironment> {
  // Create a simple mock environment for testing
  return {
    wallet: {
      deployContract: async (contractName: string, options?: any) => {
        // Mock contract deployment
        const circuits: any = {};
        
        // Add mock circuit functions based on contract name
        if (contractName === 'protocol_wallet_base') {
          let counter = 0n;
          
          circuits.getCounter = async () => counter;
          circuits.incrementCounter = async () => {
            counter += 1n;
            return counter;
          };
          circuits.getOwnerKey = async () => {
            return options?.sk ? crypto.createPublicKey({
              key: Buffer.from(options.sk),
              format: 'der',
              type: 'spki'
            }).export({ format: 'der', type: 'spki' }) : crypto.randomBytes(32);
          };
        }
        
        return {
          circuits,
          address: `0x${crypto.randomBytes(20).toString('hex')}`
        };
      }
    },
    teardown: async () => {
      // Mock teardown function
    }
  };
}
