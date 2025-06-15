import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NetworkId, setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import dotenv from 'dotenv';
import { existsSync } from 'fs';

// Load environment variables from encrypted secrets
const secretsPath = path.resolve(process.cwd(), '.env.secrets');
if (existsSync(secretsPath)) {
  dotenv.config({ path: secretsPath });
  console.log('✅ Loaded encrypted secrets');
} else {
  console.warn('⚠️  Encrypted secrets not found, using default environment variables');
  console.warn('   Run: npm run secrets:setup');
  dotenv.config(); // Fallback to default .env
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const currentDir = path.resolve(__dirname);

// export const contractConfig = {
//   privateStateStoreName: 'counter-private-state',
//   zkConfigPath: path.resolve(currentDir, '..', '..', 'contract', 'src', 'managed', 'counter'),
// };

export const combinedContractConfig = {
  privateStateStoreName: 'combinedContractPrivateState',
  zkConfigPath: path.resolve(currentDir, '..', '..', 'contract', 'src', 'managed', 'combinedContract'),
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