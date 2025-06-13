import { type Resource } from '@midnight-ntwrk/wallet';
import { type Wallet } from '@midnight-ntwrk/wallet-api';
import path from 'path';
import * as api from '../api';
import { DeployedCombinedContractContract, type CombinedContractProviders } from '../common-types';
import { currentDir } from '../config';
import { createLogger } from '../logger-utils';
import { TestConfiguration, TestEnvironment } from './commons';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { fromHex } from '@midnight-ntwrk/midnight-js-utils';
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
  let testConfiguration: TestConfiguration;

  beforeAll(
    async () => {
      api.setLogger(logger);
      testEnvironment = new TestEnvironment(logger);
      testConfiguration = await testEnvironment.start();
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
      const ownerSecretKey = fromHex(ownerSeed);
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

    // logger.info(`Metadata hash: ${metadataHash}`);

    // Mint a DIDz NFT
    const didzNFT = await api.mintDIDzNFT(deployedContract, metadataHash, didBytes);
    expect(didzNFT).not.toBeNull();

    // Get the DIDz NFT given the DID
    const fetchedDIDzNFT = await api.getDIDzNFT(deployedContract, 1);
    expect(fetchedDIDzNFT).not.toBeNull();
    expect(fetchedDIDzNFT.ownerAddress).toEqual(ownerAddressBytes);
    expect(fetchedDIDzNFT.metadataHash).toEqual(metadataHash);
    expect(fetchedDIDzNFT.did).toEqual(didBytes);
  });

  it('should not mint a DIDz NFT if not owner', async () => {

    const metadataHash = await generateMetadataHash('{"name":"DIDz NFT","description":"A DIDz NFT","image":"https://example.com/image.png"}');

    // 1. Create a new, temporary non-owner wallet
    const { wallet: anotherWallet, seed: anotherSeed } = await testEnvironment.getAnotherRandomWallet();
    logger.info(`Another wallet seed: ${anotherSeed}`);
    const anotherProviders = await api.configureCombinedContractProviders(anotherWallet, testConfiguration.dappConfig);

    // 2. Get the *actual* public key (as Uint8Array) from this newly created wallet's state.
    // This is a public key that the SDK itself has generated and should consider "undeployed".
    const anotherWalletState = await Rx.firstValueFrom(anotherWallet.state());
    const didBytes: Uint8Array = hexStringToBytes32(anotherWalletState.coinPublicKeyLegacy); // Use coinPublicKey directly

    const joinedContract = await api.joinCombinedContract(anotherProviders, deployedContract.deployTxData.public.contractAddress);
    logger.info(`Joined contract address: ${joinedContract.deployTxData.public.contractAddress}`);

    // 3. Attempt to mint a DIDz NFT with this "undeployed" public key
    await expect(async () => {
      await joinedContract.callTx.mintDIDzNFT({ bytes: didBytes }, { bytes: metadataHash });
    }).rejects.toThrow('ERR_AUTH: Only contract owner can mint DIDz NFTs');

    // 4. Important: Close the temporary wallet to release resources
    await anotherWallet.close();
  });
});
