import { Resource } from "@midnight-ntwrk/wallet";
import { combinedContractConfig, Config, ServerConfig } from "./config";
import { Wallet } from "@midnight-ntwrk/wallet-api";
import * as fs from "node:fs";
import { WalletBuilder } from "@midnight-ntwrk/wallet";
import { CoinInfo, nativeToken, Transaction, TransactionId } from "@midnight-ntwrk/ledger";
import { getLedgerNetworkId, getZswapNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import * as Rx from "rxjs";
import { webcrypto } from "node:crypto";
import { WalletProvider, MidnightProvider, UnbalancedTransaction, BalancedTransaction, createBalancedTx } from "@midnight-ntwrk/midnight-js-types";
import { Transaction as ZswapTransaction } from '@midnight-ntwrk/zswap';
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import { CombinedContractProviders, CombinedContractPrivateStateId } from "./types";

export const streamToString = async (
    stream: fs.ReadStream
): Promise<string> => {
    const chunks: Buffer[] = [];
    return await new Promise((resolve, reject) => {
        stream.on("data", (chunk) =>
            chunks.push(
                typeof chunk === "string" ? Buffer.from(chunk, "utf8") : chunk
            )
        );
        stream.on("error", (err) => {
            reject(err);
        });
        stream.on("end", () => {
            resolve(Buffer.concat(chunks).toString("utf8"));
        });
    });
};

export const waitForSyncProgress = async (wallet: Wallet) =>
    await Rx.firstValueFrom(
        wallet.state().pipe(
            Rx.throttleTime(5_000),
            Rx.tap((state) => {
                const applyGap = state.syncProgress?.lag.applyGap ?? 0n;
                const sourceGap = state.syncProgress?.lag.sourceGap ?? 0n;
                console.info(
                    `Waiting for funds. Backend lag: ${sourceGap}, wallet lag: ${applyGap}, transactions=${state.transactionHistory.length}`
                );
            }),
            Rx.filter((state) => {
                // Let's allow progress only if syncProgress is defined
                return state.syncProgress !== undefined;
            })
        )
    );

export const isAnotherChain = async (wallet: Wallet, offset: number) => {
    await waitForSyncProgress(wallet);
    // Here wallet does not expose the offset block it is synced to, that is why this workaround
    const walletOffset = Number(
        JSON.parse(await wallet.serializeState()).offset
    );
    if (walletOffset < offset - 1) {
        console.info(
            `Your offset offset is: ${walletOffset} restored offset: ${offset} so it is another chain`
        );
        return true;
    } else {
        console.info(
            `Your offset offset is: ${walletOffset} restored offset: ${offset} ok`
        );
        return false;
    }
};

export const waitForSync = (wallet: Wallet) =>
    Rx.firstValueFrom(
        wallet.state().pipe(
            Rx.throttleTime(5_000),
            Rx.tap((state) => {
                const applyGap = state.syncProgress?.lag.applyGap ?? 0n;
                const sourceGap = state.syncProgress?.lag.sourceGap ?? 0n;
                console.info(
                    `Waiting for funds. Backend lag: ${sourceGap}, wallet lag: ${applyGap}, transactions=${state.transactionHistory.length}`
                );
            }),
            Rx.filter((state) => {
                // Let's allow progress only if wallet is synced fully
                return (
                    state.syncProgress !== undefined &&
                    state.syncProgress.synced
                );
            })
        )
    );

export const waitForFunds = (wallet: Wallet) =>
    Rx.firstValueFrom(
        wallet.state().pipe(
            Rx.throttleTime(10_000),
            Rx.tap((state) => {
                const applyGap = state.syncProgress?.lag.applyGap ?? 0n;
                const sourceGap = state.syncProgress?.lag.sourceGap ?? 0n;
                console.info(
                    `Waiting for funds. Backend lag: ${sourceGap}, wallet lag: ${applyGap}, transactions=${state.transactionHistory.length}`
                );
            }),
            Rx.filter((state) => {
                // Let's allow progress only if wallet is synced
                return state.syncProgress?.synced === true;
            }),
            Rx.map((s) => s.balances[nativeToken()] ?? 0n),
            Rx.filter((balance) => balance > 0n)
        )
    );

export const buildWalletAndWaitForFunds = async (
    { indexer, indexerWS, node, proofServer }: Config,
    seed: string,
    filename: string
): Promise<Wallet & Resource> => {
    const directoryPath = process.env.SYNC_CACHE;
    let wallet: Wallet & Resource;
    if (directoryPath !== undefined) {
        if (fs.existsSync(`${directoryPath}/${filename}`)) {
            console.info(
                `Attempting to restore state from ${directoryPath}/${filename}`
            );
            try {
                const serializedStream = fs.createReadStream(
                    `${directoryPath}/${filename}`,
                    "utf-8"
                );
                const serialized = await streamToString(serializedStream);
                serializedStream.on("finish", () => {
                    serializedStream.close();
                });
                wallet = await WalletBuilder.restore(
                    indexer,
                    indexerWS,
                    proofServer,
                    node,
                    seed,
                    serialized,
                    "info"
                );
                wallet.start();
                const stateObject = JSON.parse(serialized);
                if (
                    (await isAnotherChain(
                        wallet,
                        Number(stateObject.offset)
                    )) === true
                ) {
                    console.warn(
                        "The chain was reset, building wallet from scratch"
                    );
                    wallet = await WalletBuilder.buildFromSeed(
                        indexer,
                        indexerWS,
                        proofServer,
                        node,
                        seed,
                        getZswapNetworkId(),
                        "info"
                    );
                    wallet.start();
                } else {
                    const newState = await waitForSync(wallet);
                    // allow for situations when there's no new index in the network between runs
                    if (newState.syncProgress?.synced) {
                        console.info(
                            "Wallet was able to sync from restored state"
                        );
                    } else {
                        console.info(`Offset: ${stateObject.offset}`);
                        console.info(
                            `SyncProgress.lag.applyGap: ${newState.syncProgress?.lag.applyGap}`
                        );
                        console.info(
                            `SyncProgress.lag.sourceGap: ${newState.syncProgress?.lag.sourceGap}`
                        );
                        console.warn(
                            "Wallet was not able to sync from restored state, building wallet from scratch"
                        );
                        wallet = await WalletBuilder.buildFromSeed(
                            indexer,
                            indexerWS,
                            proofServer,
                            node,
                            seed,
                            getZswapNetworkId(),
                            "info"
                        );
                        wallet.start();
                    }
                }
            } catch (error: unknown) {
                if (typeof error === "string") {
                    console.error(error);
                } else if (error instanceof Error) {
                    console.error(error.message);
                } else {
                    console.error(error);
                }
                console.warn(
                    "Wallet was not able to restore using the stored state, building wallet from scratch"
                );
                wallet = await WalletBuilder.buildFromSeed(
                    indexer,
                    indexerWS,
                    proofServer,
                    node,
                    seed,
                    getZswapNetworkId(),
                    "info"
                );
                wallet.start();
            }
        } else {
            console.info(
                "Wallet save file not found, building wallet from scratch"
            );
            wallet = await WalletBuilder.buildFromSeed(
                indexer,
                indexerWS,
                proofServer,
                node,
                seed,
                getZswapNetworkId(),
                "info"
            );
            wallet.start();
        }
    } else {
        console.info(
            "File path for save file not found, building wallet from scratch"
        );
        wallet = await WalletBuilder.buildFromSeed(
            indexer,
            indexerWS,
            proofServer,
            node,
            seed,
            getZswapNetworkId(),
            "info"
        );
        wallet.start();
    }

    const state = await Rx.firstValueFrom(wallet.state());
    console.info(`Your wallet seed is: ${seed}`);
    console.info(`Your wallet address is: ${state.address}`);
    let balance = state.balances[nativeToken()];
    if (balance === undefined || balance === 0n) {
        console.info(`Your wallet balance is: 0`);
        console.info(`Waiting to receive tokens...`);
        balance = await waitForFunds(wallet);
    }
    console.info(`Your wallet balance is: ${balance}`);
    return wallet;
};

export const randomBytes = (length: number): Uint8Array => {
    const bytes = new Uint8Array(length);
    webcrypto.getRandomValues(bytes);
    return bytes;
  };

export const buildFreshWallet = async (config: ServerConfig): Promise<Wallet & Resource> => {

    console.info('Building fresh wallet with config: ', config);
    const wallet = await buildWalletAndWaitForFunds(config.midnight, config.walletSeed, config.walletFilename);
    return wallet;
}

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
