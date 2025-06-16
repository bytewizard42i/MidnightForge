import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NetworkId, setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { execSync } from 'child_process';

// Load environment variables from encrypted secrets
// Look for encrypted secrets in the project root (one level up from server directory)
const encryptedSecretsPath = path.resolve(process.cwd(), '..', '.env.secrets.enc');
const keyPath = path.resolve(process.cwd(), '..', 'key.txt');

if (existsSync(encryptedSecretsPath) && existsSync(keyPath)) {
  try {
    // Use SOPS to decrypt the secrets and load them
    process.env.SOPS_AGE_KEY_FILE = keyPath;
    
    const decryptedContent = execSync(
      `sops --decrypt --input-type dotenv --output-type dotenv "${encryptedSecretsPath}"`,
      { encoding: 'utf8', cwd: path.resolve(process.cwd(), '..') }
    );
    
    // Parse and load the decrypted environment variables
    const lines = decryptedContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match && match[1] && match[2] !== undefined) {
          const key = match[1].trim();
          const value = match[2].replace(/^["']|["']$/g, '');
          process.env[key] = value;
        }
      }
    }
    
    console.log('✅ Loaded and decrypted secrets from', encryptedSecretsPath);
  } catch (error: any) {
    console.warn('⚠️  Failed to decrypt secrets, using default environment variables');
    console.warn('   Error:', error.message);
    dotenv.config(); // Fallback to default .env
  }
} else {
  console.warn('⚠️  Encrypted secrets or key file not found, using default environment variables');
  console.warn('   Looking for:', encryptedSecretsPath);
  console.warn('   And key file:', keyPath);
  console.warn('   Run: npm run secrets:setup');
  dotenv.config(); // Fallback to default .env
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const currentDir = path.resolve(__dirname);

export const combinedContractConfig = {
  privateStateStoreName: 'combinedContractPrivateState',
  zkConfigPath: path.resolve(currentDir, '..', '..', 'nft-contract', 'dist', 'managed', 'combinedContract'),
};

export interface Config {
  readonly logDir: string;
  readonly indexer: string;
  readonly indexerWS: string;
  readonly node: string;
  readonly proofServer: string;
}

export interface ServerConfig {
  readonly port: number;
  readonly ip: string;
  readonly nodeEnv: string;
  readonly corsOrigin: string;
  readonly logLevel: string;
  readonly walletSeed: string;
  readonly walletFilename: string;
  readonly midnight: Config;
}

export class TestnetRemoteConfig implements Config {
  logDir = path.resolve(currentDir, '..', 'logs', 'testnet-remote', `${new Date().toISOString()}.log`);
  indexer = process.env.MIDNIGHT_INDEXER_URL || 'https://indexer.testnet-02.midnight.network/api/v1/graphql';
  indexerWS = process.env.MIDNIGHT_INDEXER_WS_URL || 'wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws';
  node = process.env.MIDNIGHT_NODE_URL || 'https://rpc.testnet-02.midnight.network';
  proofServer = process.env.MIDNIGHT_PROOF_SERVER_URL || 'http://127.0.0.1:6300';
  
  constructor() {
    setNetworkId(NetworkId.TestNet);
  }
}

const GENESIS_MINT_WALLET_SEED = '0000000000000000000000000000000000000000000000000000000000000001';

export class LocalConfig implements Config {
  logDir = path.resolve(currentDir, '..', 'logs', 'local', `${new Date().toISOString()}.log`);
  indexer = 'http://127.0.0.1:8088/api/v1/graphql';
  indexerWS = 'ws://127.0.0.1:8088/api/v1/graphql/ws';
  node = 'http://127.0.0.1:9944';
  proofServer = 'http://127.0.0.1:6300';
  
  constructor() {
    setNetworkId(NetworkId.Undeployed);
  }
}

export const getServerConfig = (): ServerConfig => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  const isLocal = process.env.MIDNIGHT_NETWORK === 'local';
  const ip = process.env.IP || 'localhost';
  const walletSeed = process.env.WALLET_SEED || '';

  return {
    port: parseInt(process.env.PORT || '3001', 10),
    ip,
    nodeEnv,
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    logLevel: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    walletSeed: isLocal ? GENESIS_MINT_WALLET_SEED : walletSeed,
    walletFilename: process.env.WALLET_FILENAME || 'server_wallet.dat',
    midnight: isLocal ? new LocalConfig() : new TestnetRemoteConfig(),
  };
}; 