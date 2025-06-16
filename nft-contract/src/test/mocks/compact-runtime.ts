// Mock implementation of @midnight-ntwrk/compact-runtime
// This provides the necessary types and functions for testing without requiring the actual package

import crypto from 'crypto';

// Define the CircuitContext interface
export interface CircuitContext<T> {
  currentPrivateState: T;
  currentZswapLocalState: any;
  originalState: any;
  transactionContext: QueryContext;
}

// Define the QueryContext class
export class QueryContext {
  state: any;
  contractAddress: string;

  constructor(state: any, contractAddress: string) {
    this.state = state;
    this.contractAddress = contractAddress;
  }
}

// Generate a sample contract address
export function sampleContractAddress(): string {
  return `0x${crypto.randomBytes(20).toString('hex')}`;
}

// Create a constructor context
export function constructorContext<T>(privateState: T, salt: string): any {
  return {
    privateState,
    salt,
    contractAddress: sampleContractAddress()
  };
}
