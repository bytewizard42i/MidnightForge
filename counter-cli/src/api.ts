// This file is part of midnightntwrk/example-counter.
// Copyright (C) 2025 Midnight Foundation
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { type ContractAddress, StateValue } from '@midnight-ntwrk/compact-runtime';
import {
  CombinedContract,
  type CombinedContractPrivateState,  
  Counter,
  type CounterPrivateState,
  witnesses,
} from '@midnight-forge/protocol-did-contract';
import { type CoinInfo, nativeToken, Transaction, type TransactionId } from '@midnight-ntwrk/ledger';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import {
  type BalancedTransaction,
  createBalancedTx,
  type FinalizedTxData,
  type MidnightProvider,
  type UnbalancedTransaction,
  type WalletProvider,
} from '@midnight-ntwrk/midnight-js-types';
import { type Resource, WalletBuilder } from '@midnight-ntwrk/wallet';
import { type Wallet } from '@midnight-ntwrk/wallet-api';
import { Transaction as ZswapTransaction } from '@midnight-ntwrk/zswap';
import { webcrypto } from 'crypto';
import { type Logger } from 'pino';
import * as Rx from 'rxjs';
import { WebSocket } from 'ws';
import {
  type CounterContract,
  type CounterPrivateStateId,
  type CounterProviders,
  type DeployedCounterContract,
  CombinedContractPrivateStateId,
  type DeployedCombinedContractContract,
  type CombinedContractProviders,
  type CombinedContractContract,
} from './common-types';
import { combinedContractConfig, type Config, contractConfig } from './config';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { assertIsContractAddress, toHex } from '@midnight-ntwrk/midnight-js-utils';
import { getLedgerNetworkId, getZswapNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import * as fsAsync from 'node:fs/promises';
import * as fs from 'node:fs';

let logger: Logger;
// Instead of setting globalThis.crypto which is read-only, we'll ensure crypto is available
// but won't try to overwrite the global property
// @ts-expect-error: It's needed to enable WebSocket usage through apollo
globalThis.WebSocket = WebSocket;

export const getContractLedgerState = async <T, K>(
  providers: CounterProviders | CombinedContractProviders,
  contractAddress: ContractAddress,
  contractInstance: { ledger: (data: StateValue) => K },
  stateMapper: (ledgerState: K) => T | null,
  logMessage: string,
): Promise<T | null> => {
  assertIsContractAddress(contractAddress);
  logger.info(logMessage);
  const state = await providers.publicDataProvider
    .queryContractState(contractAddress)
    .then((contractState) => (contractState != null ? stateMapper(contractInstance.ledger(contractState.data)) : null));
  logger.info(`Ledger state: ${state}`);
  return state;
};

export const displayGenericContractValue = async <T, K, C extends { deployTxData: { public: { contractAddress: ContractAddress } } }>(
  providers: CounterProviders | CombinedContractProviders,
  deployedContract: C,
  contractInstance: { ledger: (data: StateValue) => K },
  stateMapper: (ledgerState: K) => T | null,
  logMessageChecking: string,
  logMessageFound: (value: T, contractAddress: string) => string,
  logMessageNotFound: (contractAddress: string) => string,
): Promise<{ contractAddress: string; value: T | null }> => {
  const contractAddress = deployedContract.deployTxData.public.contractAddress;
  const value = await getContractLedgerState(
    providers,
    contractAddress,
    contractInstance,
    stateMapper,
    logMessageChecking,
  );
  if (value === null) {
    logger.info(logMessageNotFound(contractAddress));
  } else {
    logger.info(logMessageFound(value, contractAddress));
  }
  return { contractAddress, value };
};

export const getCounterLedgerState = async (
  providers: CounterProviders,
  contractAddress: ContractAddress,
): Promise<bigint | null> => {
  assertIsContractAddress(contractAddress);
  logger.info('Checking contract ledger state...');
  const state = await providers.publicDataProvider
    .queryContractState(contractAddress)
    .then((contractState) => (contractState != null ? Counter.ledger(contractState.data).round : null));
  logger.info(`Ledger state: ${state}`);
  return state;
};

export const getCombinedContractOwnerKey = async (
  providers: CombinedContractProviders,
  contractAddress: ContractAddress,
): Promise<string | null> => {
  assertIsContractAddress(contractAddress);
  logger.info('Checking contract owner key...');
  const state = await providers.publicDataProvider
    .queryContractState(contractAddress)
    .then((contractState) => (contractState != null ? CombinedContract.ledger(contractState.data).ownerKey : null));
  logger.info(`getCombinedContractOwnerKey: Owner key: ${state}`);

  // convert state to string
  const ownerKey = toHex(state as Uint8Array);
  return ownerKey;
};

export const getCombinedContractOwnerAddress = async (
  providers: CombinedContractProviders,
  contractAddress: ContractAddress,
): Promise<Uint8Array | null> => {
  assertIsContractAddress(contractAddress);
  logger.info('Checking contract owner address...');
  const state = await providers.publicDataProvider
    .queryContractState(contractAddress)
    .then((contractState) => (contractState != null ? CombinedContract.ledger(contractState.data).ownerAddress : null));
  logger.info(`getCombinedContractOwnerAddress: Owner address: ${state}`);

  // Return the raw bytes directly
  return state;
};

export const counterContractInstance: CounterContract = new Counter.Contract(witnesses);
export const combinedContractInstance: CombinedContractContract = new CombinedContract.Contract(witnesses);

export const joinContract = async (
  providers: CounterProviders,
  contractAddress: string,
): Promise<DeployedCounterContract> => {
  const counterContract = await findDeployedContract(providers, {
    contractAddress,
    contract: counterContractInstance,
    privateStateId: 'counterPrivateState',
    initialPrivateState: { privateCounter: 0 },
  });
  logger.info(`Joined contract at address: ${counterContract.deployTxData.public.contractAddress}`);
  return counterContract;
};

export const joinCombinedContract = async (
  providers: CombinedContractProviders,
  contractAddress: string,
): Promise<DeployedCombinedContractContract> => {
  const combinedContract = await findDeployedContract(providers, {
    contractAddress,
    contract: combinedContractInstance,
    privateStateId: CombinedContractPrivateStateId,
    initialPrivateState: { privateValue: 0 },
  });
  return combinedContract;
};

export const deploy = async (
  providers: CounterProviders,
  privateState: CounterPrivateState,
): Promise<DeployedCounterContract> => {
  logger.info('Deploying counter contract...');
  const counterContract = await deployContract(providers, {
    contract: counterContractInstance,
    privateStateId: 'counterPrivateState',
    initialPrivateState: privateState,
  });
  logger.info(`Deployed contract at address: ${counterContract.deployTxData.public.contractAddress}`);
  return counterContract;
};

export const deployCombinedContract = async (
  providers: CombinedContractProviders,
  privateState: CombinedContractPrivateState,
  ownerSecretKey: Uint8Array,
  ownerAddress: Uint8Array,
): Promise<DeployedCombinedContractContract> => {
  logger.info('Deploying combined contract...');
  const combinedContract = await deployContract(providers, {
    contract: combinedContractInstance,
    privateStateId: CombinedContractPrivateStateId,
    initialPrivateState: privateState,
    args: [ownerSecretKey, ownerAddress],
  });
  logger.info(`Deployed contract at address: ${combinedContract.deployTxData.public.contractAddress}`);
  return combinedContract;
};

export const increment = async (counterContract: DeployedCounterContract): Promise<FinalizedTxData> => {
  logger.info('Incrementing...');
  const finalizedTxData = await counterContract.callTx.increment();
  logger.info(`Transaction ${finalizedTxData.public.txId} added in block ${finalizedTxData.public.blockHeight}`);
  return finalizedTxData.public;
};

export const mintDIDzNFT = async (
  combinedContract: DeployedCombinedContractContract,
  metadataHash: Uint8Array,
  did: Uint8Array,
): Promise<bigint> => {
  logger.info('Minting DIDz NFT...');
  const finalizedTxData = await combinedContract.callTx.mintDIDzNFT({ bytes: did }, { bytes: metadataHash });
  logger.info(`Transaction ${finalizedTxData.public.txId} added in block ${finalizedTxData.public.blockHeight}`);
  return finalizedTxData.private.result;
};

export const getDIDzNFT = async (combinedContract: DeployedCombinedContractContract, nftId: bigint) => {
  logger.info(`Getting DIDz NFT for nftId: ${nftId}...`);
  const finalizedTxData = await combinedContract.callTx.getDIDzNFTFromId(nftId);
  const nftResult = finalizedTxData.private.result;

  // Decode Uint8Array fields to hexadecimal strings for readability
  const nft = {
    ownerAddress: nftResult.ownerAddress,
    metadataHash: nftResult.metadataHash,
    did: nftResult.did,
  };

  // logger.info(`DIDz NFT: ${JSON.stringify(decodedNft, (key, value) => typeof value === 'bigint' ? value.toString() : value)}`);
  return nft;
};

export const transferDIDzNFT = async (
  combinedContract: DeployedCombinedContractContract,
  nftId: bigint,
  newRecipientDID: Uint8Array,
  newOwnerAddress: Uint8Array,
): Promise<FinalizedTxData> => {
  logger.info(`Transferring DIDz NFT ${nftId} to DID ${newRecipientDID} and address ${newOwnerAddress}`);
  const finalizedTxData = await combinedContract.callTx.transferDIDzNFT(
    BigInt(nftId),
    { bytes: newRecipientDID },
    newOwnerAddress,
  );
  logger.info(`DIDz NFT ${nftId} transferred. TxId: ${finalizedTxData.public.txId}`);
  return finalizedTxData.public;
};

export const updateDIDzNFTMetadata = async (
  combinedContract: DeployedCombinedContractContract,
  nftId: bigint,
  newMetadataHash: Uint8Array,
): Promise<FinalizedTxData> => {
  logger.info(`Updating metadata for DIDz NFT ${nftId} with new hash ${newMetadataHash}`);
  const finalizedTxData = await combinedContract.callTx.updateDIDzNFTMetadata(
    BigInt(nftId),
    { bytes: newMetadataHash },
  );
  logger.info(`DIDz NFT ${nftId} metadata updated. TxId: ${finalizedTxData.public.txId}`);
  return finalizedTxData.public;
};

export const burnDIDzNFT = async (
  combinedContract: DeployedCombinedContractContract,
  nftId: bigint,
): Promise<FinalizedTxData> => {
  logger.info(`Burning DIDz NFT ${nftId}`);
  const finalizedTxData = await combinedContract.callTx.burnDIDzNFT(BigInt(nftId));
  logger.info(`DIDz NFT ${nftId} burned. TxId: ${finalizedTxData.public.txId}`);
  return finalizedTxData.public;
};

export const displayCounterValue = async (
  providers: CounterProviders,
  counterContract: DeployedCounterContract,
): Promise<{ counterValue: bigint | null; contractAddress: string }> => {
  const { contractAddress, value: counterValue } = await displayGenericContractValue(
    providers,
    counterContract,
    { ledger: Counter.ledger },
    (ledgerState) => ledgerState.round,
    'Checking counter contract ledger state...',
    (value) => `Current counter value: ${Number(value)}`,
    (contractAddress) => `There is no counter contract deployed at ${contractAddress}.`,
  );
  return { contractAddress, counterValue };
};

export const displayCombinedContractOwnerKey = async (
  providers: CombinedContractProviders,
  combinedContract: DeployedCombinedContractContract,
): Promise<{ contractAddress: string; ownerKey: string | null }> => {
  const { contractAddress, value: ownerKeyBytes } = await displayGenericContractValue(
    providers,
    combinedContract,
    { ledger: CombinedContract.ledger },
    (ledgerState) => ledgerState.ownerKey,
    'Checking combined contract owner key...',
    (value, _contractAddress) => `Owner key: ${toHex(value as Uint8Array)}`,
    (contractAddress) => `There is no combined contract deployed at ${contractAddress}.`,
  );
  const ownerKey = ownerKeyBytes !== null ? toHex(ownerKeyBytes as Uint8Array) : null;
  return { contractAddress, ownerKey };
};

export const displayCombinedContractOwnerAddress = async (
  providers: CombinedContractProviders,
  combinedContract: DeployedCombinedContractContract,
): Promise<{ contractAddress: string; ownerAddress: Uint8Array | null }> => {
  const { contractAddress, value: ownerAddress } = await displayGenericContractValue(
    providers,
    combinedContract,
    { ledger: CombinedContract.ledger },
    (ledgerState) => ledgerState.ownerAddress,
    'Checking combined contract owner address...',
    (value, _contractAddress) => `Owner address: ${value}`,
    (contractAddress) => `There is no combined contract deployed at ${contractAddress}.`,
  );
  return { contractAddress, ownerAddress };
};

export const createWalletAndMidnightProvider = async (wallet: Wallet): Promise<WalletProvider & MidnightProvider> => {
  const state = await Rx.firstValueFrom(wallet.state());
  return {
    coinPublicKey: state.coinPublicKey,
    encryptionPublicKey: state.encryptionPublicKey,
    balanceTx(tx: UnbalancedTransaction, newCoins: CoinInfo[]): Promise<BalancedTransaction> {
      return wallet
        .balanceTransaction(
          ZswapTransaction.deserialize(tx.serialize(getLedgerNetworkId()), getZswapNetworkId()),
          newCoins,
        )
        .then((tx) => wallet.proveTransaction(tx))
        .then((zswapTx) => Transaction.deserialize(zswapTx.serialize(getZswapNetworkId()), getLedgerNetworkId()))
        .then(createBalancedTx);
    },
    submitTx(tx: BalancedTransaction): Promise<TransactionId> {
      return wallet.submitTransaction(tx);
    },
  };
};

export const waitForSync = (wallet: Wallet) =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(5_000),
      Rx.tap((state) => {
        const applyGap = state.syncProgress?.lag.applyGap ?? 0n;
        const sourceGap = state.syncProgress?.lag.sourceGap ?? 0n;
        logger.info(
          `Waiting for funds. Backend lag: ${sourceGap}, wallet lag: ${applyGap}, transactions=${state.transactionHistory.length}`,
        );
      }),
      Rx.filter((state) => {
        // Let's allow progress only if wallet is synced fully
        return state.syncProgress !== undefined && state.syncProgress.synced;
      }),
    ),
  );

export const waitForSyncProgress = async (wallet: Wallet) =>
  await Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(5_000),
      Rx.tap((state) => {
        const applyGap = state.syncProgress?.lag.applyGap ?? 0n;
        const sourceGap = state.syncProgress?.lag.sourceGap ?? 0n;
        logger.info(
          `Waiting for funds. Backend lag: ${sourceGap}, wallet lag: ${applyGap}, transactions=${state.transactionHistory.length}`,
        );
      }),
      Rx.filter((state) => {
        // Let's allow progress only if syncProgress is defined
        return state.syncProgress !== undefined;
      }),
    ),
  );

export const waitForFunds = (wallet: Wallet) =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(10_000),
      Rx.tap((state) => {
        const applyGap = state.syncProgress?.lag.applyGap ?? 0n;
        const sourceGap = state.syncProgress?.lag.sourceGap ?? 0n;
        logger.info(
          `Waiting for funds. Backend lag: ${sourceGap}, wallet lag: ${applyGap}, transactions=${state.transactionHistory.length}`,
        );
      }),
      Rx.filter((state) => {
        // Let's allow progress only if wallet is close enough
        // const applyGap = state.syncProgress?.lag.applyGap ?? 0n;
        // const sourceGap = state.syncProgress?.lag.sourceGap ?? 0n;
        // return applyGap < 100n && sourceGap < 100n;
        return state.syncProgress?.synced === true;
      }),
      Rx.map((s) => s.balances[nativeToken()] ?? 0n),
      Rx.filter((balance) => balance > 0n),
    ),
  );

export const buildWalletAndWaitForFunds = async (
  { indexer, indexerWS, node, proofServer }: Config,
  seed: string,
  filename: string,
): Promise<Wallet & Resource> => {
  const directoryPath = process.env.SYNC_CACHE;
  let wallet: Wallet & Resource;
  if (directoryPath !== undefined) {
    if (fs.existsSync(`${directoryPath}/${filename}`)) {
      logger.info(`Attempting to restore state from ${directoryPath}/${filename}`);
      try {
        const serializedStream = fs.createReadStream(`${directoryPath}/${filename}`, 'utf-8');
        const serialized = await streamToString(serializedStream);
        serializedStream.on('finish', () => {
          serializedStream.close();
        });
        wallet = await WalletBuilder.restore(indexer, indexerWS, proofServer, node, seed, serialized, 'info');
        wallet.start();
        const stateObject = JSON.parse(serialized);
        if ((await isAnotherChain(wallet, Number(stateObject.offset))) === true) {
          logger.warn('The chain was reset, building wallet from scratch');
          wallet = await WalletBuilder.buildFromSeed(
            indexer,
            indexerWS,
            proofServer,
            node,
            seed,
            getZswapNetworkId(),
            'info',
          );
          wallet.start();
        } else {
          const newState = await waitForSync(wallet);
          // allow for situations when there's no new index in the network between runs
          if (newState.syncProgress?.synced) {
            logger.info('Wallet was able to sync from restored state');
          } else {
            logger.info(`Offset: ${stateObject.offset}`);
            logger.info(`SyncProgress.lag.applyGap: ${newState.syncProgress?.lag.applyGap}`);
            logger.info(`SyncProgress.lag.sourceGap: ${newState.syncProgress?.lag.sourceGap}`);
            logger.warn('Wallet was not able to sync from restored state, building wallet from scratch');
            wallet = await WalletBuilder.buildFromSeed(
              indexer,
              indexerWS,
              proofServer,
              node,
              seed,
              getZswapNetworkId(),
              'info',
            );
            wallet.start();
          }
        }
      } catch (error: unknown) {
        if (typeof error === 'string') {
          logger.error(error);
        } else if (error instanceof Error) {
          logger.error(error.message);
        } else {
          logger.error(error);
        }
        logger.warn('Wallet was not able to restore using the stored state, building wallet from scratch');
        wallet = await WalletBuilder.buildFromSeed(
          indexer,
          indexerWS,
          proofServer,
          node,
          seed,
          getZswapNetworkId(),
          'info',
        );
        wallet.start();
      }
    } else {
      logger.info('Wallet save file not found, building wallet from scratch');
      wallet = await WalletBuilder.buildFromSeed(
        indexer,
        indexerWS,
        proofServer,
        node,
        seed,
        getZswapNetworkId(),
        'info',
      );
      wallet.start();
    }
  } else {
    logger.info('File path for save file not found, building wallet from scratch');
    wallet = await WalletBuilder.buildFromSeed(
      indexer,
      indexerWS,
      proofServer,
      node,
      seed,
      getZswapNetworkId(),
      'info',
    );
    wallet.start();
  }

  const state = await Rx.firstValueFrom(wallet.state());
  logger.info(`Your wallet seed is: ${seed}`);
  logger.info(`Your wallet address is: ${state.address}`);
  let balance = state.balances[nativeToken()];
  if (balance === undefined || balance === 0n) {
    logger.info(`Your wallet balance is: 0`);
    logger.info(`Waiting to receive tokens...`);
    balance = await waitForFunds(wallet);
  }
  logger.info(`Your wallet balance is: ${balance}`);
  return wallet;
};

export const randomBytes = (length: number): Uint8Array => {
  const bytes = new Uint8Array(length);
  webcrypto.getRandomValues(bytes);
  return bytes;
};

export const buildFreshWallet = async (config: Config): Promise<Wallet & Resource> =>
  await buildWalletAndWaitForFunds(config, toHex(randomBytes(32)), '');

export const buildFreshWalletReturnSeed = async (
  config: Config,
): Promise<{ wallet: Wallet & Resource; seed: string }> => {
  const seed = toHex(randomBytes(32));
  const wallet = await buildWalletAndWaitForFunds(config, seed, '');
  return { wallet, seed };
};

export const configureProviders = async (wallet: Wallet & Resource, config: Config): Promise<CounterProviders> => {
  const walletAndMidnightProvider = await createWalletAndMidnightProvider(wallet);
  return {
    privateStateProvider: levelPrivateStateProvider<typeof CounterPrivateStateId>({
      privateStateStoreName: contractConfig.privateStateStoreName,
    }),
    publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
    zkConfigProvider: new NodeZkConfigProvider<'increment'>(contractConfig.zkConfigPath),
    proofProvider: httpClientProofProvider(config.proofServer),
    walletProvider: walletAndMidnightProvider,
    midnightProvider: walletAndMidnightProvider,
  };
};

export const configureCombinedContractProviders = async (
  wallet: Wallet & Resource,
  config: Config,
): Promise<CombinedContractProviders> => {
  const walletAndMidnightProvider = await createWalletAndMidnightProvider(wallet);
  return {
    privateStateProvider: levelPrivateStateProvider<typeof CombinedContractPrivateStateId>({
      privateStateStoreName: combinedContractConfig.privateStateStoreName,
    }),
    publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
    zkConfigProvider: new NodeZkConfigProvider<'incrementCounter'>(combinedContractConfig.zkConfigPath),
    walletProvider: walletAndMidnightProvider,
    midnightProvider: walletAndMidnightProvider,
    proofProvider: httpClientProofProvider(config.proofServer),
    mintDIDzNFTZkConfigProvider: new NodeZkConfigProvider<'mintDIDzNFT'>(combinedContractConfig.zkConfigPath),
    getDIDzNFTOwnerZkConfigProvider: new NodeZkConfigProvider<'getDIDzNFTOwner'>(combinedContractConfig.zkConfigPath),
    getDIDzNFTMetadataHashZkConfigProvider: new NodeZkConfigProvider<'getDIDzNFTMetadataHash'>(
      combinedContractConfig.zkConfigPath,
    ),
    getOwnerKeyZkConfigProvider: new NodeZkConfigProvider<'getOwnerKey'>(combinedContractConfig.zkConfigPath),
    incrementCounterZkConfigProvider: new NodeZkConfigProvider<'incrementCounter'>(combinedContractConfig.zkConfigPath),
    getCounterZkConfigProvider: new NodeZkConfigProvider<'getCounter'>(combinedContractConfig.zkConfigPath),
    getOwnerAddressZkConfigProvider: new NodeZkConfigProvider<'getOwnerAddress'>(combinedContractConfig.zkConfigPath),
    getDIDzNFTFromIdZkConfigProvider: new NodeZkConfigProvider<'getDIDzNFTFromId'>(combinedContractConfig.zkConfigPath),
  };
};

export function setLogger(_logger: Logger) {
  logger = _logger;
}

export const streamToString = async (stream: fs.ReadStream): Promise<string> => {
  const chunks: Buffer[] = [];
  return await new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(typeof chunk === 'string' ? Buffer.from(chunk, 'utf8') : chunk));
    stream.on('error', (err) => {
      reject(err);
    });
    stream.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
  });
};

export const isAnotherChain = async (wallet: Wallet, offset: number) => {
  await waitForSyncProgress(wallet);
  // Here wallet does not expose the offset block it is synced to, that is why this workaround
  const walletOffset = Number(JSON.parse(await wallet.serializeState()).offset);
  if (walletOffset < offset - 1) {
    logger.info(`Your offset offset is: ${walletOffset} restored offset: ${offset} so it is another chain`);
    return true;
  } else {
    logger.info(`Your offset offset is: ${walletOffset} restored offset: ${offset} ok`);
    return false;
  }
};

export const saveState = async (wallet: Wallet, filename: string) => {
  const directoryPath = process.env.SYNC_CACHE;
  if (directoryPath !== undefined) {
    logger.info(`Saving state in ${directoryPath}/${filename}`);
    try {
      await fsAsync.mkdir(directoryPath, { recursive: true });
      const serializedState = await wallet.serializeState();
      const writer = fs.createWriteStream(`${directoryPath}/${filename}`);
      writer.write(serializedState);

      writer.on('finish', function () {
        logger.info(`File '${directoryPath}/${filename}' written successfully.`);
      });

      writer.on('error', function (err) {
        logger.error(err);
      });
      writer.end();
    } catch (e) {
      if (typeof e === 'string') {
        logger.warn(e);
      } else if (e instanceof Error) {
        logger.warn(e.message);
      }
    }
  } else {
    logger.info('Not saving cache as sync cache was not defined');
  }
};
