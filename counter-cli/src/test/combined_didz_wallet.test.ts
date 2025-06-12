import { type Resource } from '@midnight-ntwrk/wallet';
import { type Wallet } from '@midnight-ntwrk/wallet-api';
import path from 'path';
import * as api from '../api';
import { type CombinedContractProviders } from '../common-types';
import { currentDir } from '../config';
import { createLogger } from '../logger-utils';
import { TestEnvironment } from './commons';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { fromHex } from 'viem';
import * as Rx from 'rxjs';

const logDir = path.resolve(currentDir, '..', 'logs', 'tests', `${new Date().toISOString()}.log`);
const logger = await createLogger(logDir);

describe('Combined DIDz Wallet', () => {
  let testEnvironment: TestEnvironment;
  let wallet: Wallet & Resource;
  let providers: CombinedContractProviders;
  let ownerSeed: string;    

  beforeAll(
    async () => {
      api.setLogger(logger);
      testEnvironment = new TestEnvironment(logger);
      const testConfiguration = await testEnvironment.start();
      wallet = await testEnvironment.getWallet();   
      ownerSeed = testConfiguration.seed;

      logger.info(`Owner seed: ${ownerSeed}`);
      providers = await api.configureCombinedContractProviders(wallet, testConfiguration.dappConfig);
    },
    1000 * 60 * 45,
  );

  afterAll(async () => {
    await testEnvironment.saveWalletCache();
    await testEnvironment.shutdown();
  });

  it('should deploy the contract and check is not null', async () => {
    const state = await Rx.firstValueFrom(wallet.state());
    const ownerAddress = state.address;
    const ownerSecretKey = fromHex(`0x${ownerSeed}`, { to: 'bytes' });
    const combinedContract = await api.deployCombinedContract(providers, { privateValue: 0 }, ownerSecretKey, ownerAddress);
    expect(combinedContract).not.toBeNull();

    // Get the owner address from the contract
    const { ownerAddress: ownerAddressFromContract, contractAddress } = await api.displayCombinedContractOwnerAddress(providers, combinedContract);
    logger.info(`Owner address from contract: ${ownerAddressFromContract}`);
    logger.info(`Contract address: ${contractAddress}`);

    expect(ownerAddressFromContract).not.toBeNull();
    expect(ownerAddressFromContract).toEqual(ownerAddress);
  });

  it('should mint a DIDz NFT', async () => {

  });
});
