// Add these imports at the top
import { webcrypto } from 'crypto';

// Add this type definition
type DID = {
  bytes: Uint8Array;
};

/**
 * 
 *
 * Pros:
 * More controlled - contract enforces DID format/standards
 * Guaranteed uniqueness - contract can ensure DIDs are unique
 * Simpler client integration - clients don't need DID generation logic
 * Recommendation:
 * I recommend keeping the current client-side DID generation approach because:
 * Privacy: DID generation often involves private keys or personal data that shouldn't be exposed on-chain
 * Flexibility: Different clients might want to use different DID methods (did:midnight, did:web, etc.)
 * Separation of Concerns: The contract's primary responsibility is NFT management, not DID generation
 * Gas Efficiency: Off-chain DID generation is more gas-efficient
 *
 * This is a deterministic function that generates a DID from an owner address and a unique ID
 * The DID is a 32-byte hash of the input
 * The DID is used to identify the NFT
 * The DID is used to verify that the NFT is owned by the owner
*/
export async function generateDID(ownerAddress: string, uniqueId: string): Promise<DID> {
  // Create a deterministic input by combining owner address and uniqueId
  const input = `${ownerAddress}:${uniqueId}`;
  
  // Convert to bytes
  const encoder = new TextEncoder();
  const inputBytes = encoder.encode(input);
  
  // Generate a 32-byte hash using SHA-256
  const hashBuffer = await webcrypto.subtle.digest('SHA-256', inputBytes);
  const hashBytes = new Uint8Array(hashBuffer);
  
  return {
    bytes: hashBytes
  };
}

/**
 * This is a deterministic function that generates a metadata hash from a metadata string
 * The metadata hash is a 32-byte hash of the input
 * The metadata hash is used to identify the NFT
 * The metadata hash is used to verify that the NFT is owned by the owner
 */
export async function generateMetadataHash(metadata: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const metadataBytes = encoder.encode(metadata);
  const hashBuffer = await webcrypto.subtle.digest('SHA-256', metadataBytes);
  return new Uint8Array(hashBuffer);
}

/**
 * Converts a hex string (with or without 0x prefix) to a Bytes<32> (Uint8Array of length 32).
 * Throws if the input is not exactly 32 bytes (64 hex chars).
 */
export function hexStringToBytes32(hex: string | null): Uint8Array {
  if (hex === null) return new Uint8Array(32);
  if (hex.startsWith('0x')) hex = hex.slice(2);
  if (hex.length !== 64) throw new Error('Hex string must be 32 bytes (64 hex chars)');
  return Uint8Array.from(Buffer.from(hex, 'hex'));
}

/**
 * Converts a UTF-8 string to Bytes<32> (Uint8Array of length 32).
 * If the string is longer than 32 bytes, it is hashed with SHA-256.
 * If shorter, it is zero-padded.
 */
export function stringToBytes32(str: string | null): Uint8Array {
  if (str === null) return new Uint8Array(32);
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  if (bytes.length > 32) {
    // If too long, hash it
    if (typeof webcrypto.subtle.digest === 'function') {
      // Synchronous digest is not available in webcrypto, so we throw here for sync usage
      throw new Error('stringToBytes32: Input too long, use async hash for >32 bytes');
    } else {
      // Node.js fallback
      return Uint8Array.from(require('crypto').createHash('sha256').update(bytes).digest());
    }
  }
  // If shorter, pad with zeros
  const padded = new Uint8Array(32);
  padded.set(bytes);
  return padded;
}

/**
 * Converts Bytes<32> (Uint8Array) to a UTF-8 string, trimming trailing zeros.
 */
export function bytes32ToString(bytes: Uint8Array | null): string {
  if (bytes === null) return '';
  if (bytes.length !== 32) throw new Error('Input must be 32 bytes');
  const end = bytes.findIndex(b => b === 0);
  const slice = end === -1 ? bytes : bytes.slice(0, end);
  return new TextDecoder().decode(slice);
}

/**
 * Converts Bytes<32> (Uint8Array) to a hex string with 0x prefix.
 */
export function bytes32ToHex(bytes: Uint8Array | null): string {
  if (bytes === null) return '';
  if (bytes.length !== 32) throw new Error('Input must be 32 bytes');
  return '0x' + Buffer.from(bytes).toString('hex');
}