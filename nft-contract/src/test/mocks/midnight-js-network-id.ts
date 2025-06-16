// Mock implementation of @midnight-ntwrk/midnight-js-network-id
// This provides the necessary types and functions for testing without requiring the actual package

// Define the NetworkId enum
export enum NetworkId {
  Mainnet = 'mainnet',
  Testnet = 'testnet',
  Devnet = 'devnet',
  Undeployed = 'undeployed'
}

// Global network ID state
let currentNetworkId: NetworkId = NetworkId.Undeployed;

// Set the current network ID
export function setNetworkId(networkId: NetworkId): void {
  currentNetworkId = networkId;
}

// Get the current network ID
export function getNetworkId(): NetworkId {
  return currentNetworkId;
}
