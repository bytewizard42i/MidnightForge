import { type Resource } from '@midnight-ntwrk/wallet';
import { type Wallet } from '@midnight-ntwrk/wallet-api';
import path from 'path';
import * as api from '../api';
import { DeployedCombinedContractContract, type CombinedContractProviders } from '../common-types';
import { currentDir } from '../config';
import { createLogger } from '../logger-utils';
import { TestEnvironment } from './commons';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { fromHex } from 'viem';
import * as Rx from 'rxjs';
import { generateDID, generateMetadataHash, hexStringToBytes32, bytes32ToHex } from '../utils';

const logDir = path.resolve(currentDir, '..', 'logs', 'tests', `${new Date().toISOString()}.log`);
const logger = await createLogger(logDir);

describe('Combined DIDz Wallet', () => {
  let testEnvironment: TestEnvironment;
  let wallet: Wallet & Resource;
  let providers: CombinedContractProviders;
  let ownerSeed: string;
  let deployedContract: DeployedCombinedContractContract;
  let ownerAddress: string;
  let ownerAddressBytes: Uint8Array;

  beforeAll(
    async () => {
      api.setLogger(logger);
      testEnvironment = new TestEnvironment(logger);
      const testConfiguration = await testEnvironment.start();
      wallet = await testEnvironment.getWallet();   
      ownerSeed = testConfiguration.seed;

      logger.info(`Owner seed: ${ownerSeed}`);
      providers = await api.configureCombinedContractProviders(wallet, testConfiguration.dappConfig);

      const state = await Rx.firstValueFrom(wallet.state());
      // Get the address as a string
      ownerAddress = state.coinPublicKeyLegacy;

      logger.info(`Owner coin public key legacy: ${ownerAddress}`);
      // Convert the address string to a byte array of exactly 32 bytes for the contract
      ownerAddressBytes = hexStringToBytes32(ownerAddress);
      const ownerSecretKey = fromHex(`0x${ownerSeed}`, { to: 'bytes' });
      deployedContract = await api.deployCombinedContract(providers, { privateValue: 0 }, ownerSecretKey, ownerAddressBytes);
    },
    1000 * 60 * 45,
  );

  afterAll(async () => {
    await testEnvironment.saveWalletCache();
    await testEnvironment.shutdown();
  });

  it('should deploy the contract and check is not null', async () => {
    expect(deployedContract).not.toBeNull();

    // Get the owner address from the contract
    const { ownerAddress: ownerAddressFromContractBytes, contractAddress } = await api.displayCombinedContractOwnerAddress(providers, deployedContract);
    logger.info(`Owner address from contract: ${bytes32ToHex(ownerAddressFromContractBytes)}`);
    logger.info(`Contract address: ${contractAddress}`);

    expect(ownerAddressFromContractBytes).not.toBeNull();
    // Compare the Uint8Array directly with the one we created
    expect(ownerAddressFromContractBytes).toEqual(ownerAddressBytes);
  });

  it('should mint a DIDz NFT', async () => {

    const metadataHash = await generateMetadataHash('{"name":"DIDz NFT","description":"A DIDz NFT","image":"https://example.com/image.png"}');
    const did = await generateDID(ownerAddress, '1');
    const didBytes = did.bytes;

    logger.info(`Metadata hash: ${metadataHash}`);
    // logger.info(`DID: ${did.bytes}`);
    // logger.info(`DID bytes: ${didBytes}`);

    // Mint a DIDz NFT
    const didzNFT = await api.mintDIDzNFT(deployedContract, metadataHash, didBytes);
    expect(didzNFT).not.toBeNull();

    // Get the DIDz NFT given the DID
    // const fetchedDIDzNFT = await api.getDIDzNFT(deployedContract, didBytes);
    // expect(didzNFT).not.toBeNull();
    // expect(didzNFT.ownerAddress).toEqual(ownerAddress);
    // expect(didzNFT.metadataHash).toEqual(metadataHash);
    // expect(didzNFT.did).toEqual(didBytes);
  });
});
