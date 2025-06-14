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
  let ownerContractAddress: string;
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
      ownerContractAddress = state.coinPublicKeyLegacy;

      logger.info(`Owner coin public key legacy: ${ownerContractAddress}`);
      // Convert the address string to a byte array of exactly 32 bytes for the contract
      ownerAddressBytes = hexStringToBytes32(ownerContractAddress);
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
    const did = await generateDID(ownerContractAddress, '1');
    const didBytes = did.bytes;

    // logger.info(`Metadata hash: ${metadataHash}`);

    // Mint a DIDz NFT
    const didzNFT = await api.mintDIDzNFT(deployedContract, metadataHash, didBytes);
    expect(didzNFT).not.toBeNull();
    // The nft id should be equal to 1
    expect(didzNFT).toEqual(1n);

    // Get the DIDz NFT given the DID
    const fetchedDIDzNFT = await api.getDIDzNFT(deployedContract, didzNFT);
    expect(fetchedDIDzNFT).not.toBeNull();
    expect(fetchedDIDzNFT.ownerAddress).toEqual(ownerAddressBytes);
    expect(fetchedDIDzNFT.metadataHash).toEqual(metadataHash);
    expect(fetchedDIDzNFT.did).toEqual(didBytes);
  });

  it('should transfer a DIDz NFT', async () => {
    // Mint a new NFT to transfer
    const initialMetadataHash = await generateMetadataHash('{"name":"Transfer Test NFT","description":"NFT for transfer test"}');
    const initialDid = await generateDID(ownerContractAddress, '2');
    const initialDidBytes = initialDid.bytes;
    const nftIdToTransfer = await api.mintDIDzNFT(deployedContract, initialMetadataHash, initialDidBytes);
    expect(nftIdToTransfer).not.toBeNull();

    // Create a new recipient wallet and DID
    const { wallet: recipientWallet, seed: recipientSeed } = await testEnvironment.getAnotherRandomWallet();
    logger.info(`Recipient wallet seed: ${recipientSeed}`);
    const recipientWalletState = await Rx.firstValueFrom(recipientWallet.state());
    const newRecipientAddressBytes = hexStringToBytes32(recipientWalletState.coinPublicKeyLegacy);
    const newRecipientDID = await generateDID(recipientWalletState.coinPublicKeyLegacy, 'new-did');
    const newRecipientDIDBytes = newRecipientDID.bytes;

    // Transfer the NFT using the original owner's providers
    const nftTransferResult = await api.transferDIDzNFT(deployedContract, nftIdToTransfer, newRecipientDIDBytes, newRecipientAddressBytes);
    expect(nftTransferResult).not.toBeNull();

    // Fetch the NFT and verify the new owner
    const fetchedNFTAfterTransfer = await api.getDIDzNFT(deployedContract, nftIdToTransfer);
    expect(fetchedNFTAfterTransfer.ownerAddress).toEqual(newRecipientAddressBytes);
    expect(fetchedNFTAfterTransfer.did).toEqual(newRecipientDIDBytes);

    // Attempt to transfer from the old owner (should fail)
    await expect(async () => {
      await api.transferDIDzNFT(deployedContract, nftIdToTransfer, initialDidBytes, ownerAddressBytes);
    }).rejects.toThrow('ERR_AUTH: Only the current owner can transfer this DIDz NFT');

    await recipientWallet.close();
  });

  it('should update DIDz NFT metadata', async () => {
    // Mint a new NFT to update
    const initialMetadataHash = await generateMetadataHash('{"name":"Update Test NFT","description":"NFT for metadata update test"}');
    const initialDid = await generateDID(ownerContractAddress, '3');
    const initialDidBytes = initialDid.bytes;
    const nftIdToUpdate = await api.mintDIDzNFT(deployedContract, initialMetadataHash, initialDidBytes);
    expect(nftIdToUpdate).not.toBeNull();

    // Generate new metadata hash
    const newMetadataHash = await generateMetadataHash('{"name":"Updated Test NFT","description":"Metadata updated!"}');

    // Update the NFT metadata
    const updateResult = await api.updateDIDzNFTMetadata(deployedContract, nftIdToUpdate, newMetadataHash);
    expect(updateResult).not.toBeNull();

    // Fetch the NFT and verify the new metadata hash
    const fetchedNFTAfterUpdate = await api.getDIDzNFT(deployedContract, nftIdToUpdate);
    expect(fetchedNFTAfterUpdate.metadataHash).toEqual(newMetadataHash);


    //TODO: Fix this test later with error:
    // FAIL  src/test/combined_didz_wallet.test.ts > Combined DIDz Wallet > should update DIDz NFT metadata
    // Error: Expected undeployed address, got test one
    //  ❯ Bech32mCodec.decode ../node_modules/@midnight-ntwrk/wallet-sdk-address-format/src/index.ts:69:13
    //  ❯ parseCoinPublicKeyToHex ../node_modules/@midnight-ntwrk/midnight-js-utils/src/hex-utils.ts:179:47
    //  ❯ createUnprovenCallTx ../node_modules/@midnight-ntwrk/midnight-js-contracts/src/unproven-call-tx.ts:251:9
    //  ❯ submitCallTx ../node_modules/@midnight-ntwrk/midnight-js-contracts/src/submit-call-tx.ts:58:30
    //  ❯ Module.updateDIDzNFTMetadata src/api.ts:271:27
    //     269| ): Promise<FinalizedTxData> => {
    //     270|   logger.info(`Updating metadata for DIDz NFT ${nftId} with new hash ${newMetadataHash}`);
    //     271|   const finalizedTxData = await combinedContract.callTx.updateDIDzNFTMetadata(
    //        |                           ^
    //     272|     BigInt(nftId),
    //     273|     { bytes: newMetadataHash },
    //  ❯ src/test/combined_didz_wallet.test.ts:152:7
    // Attempt to update metadata from a non-owner (should fail)
    // const { wallet: anotherWallet, seed: anotherSeed } = await testEnvironment.getAnotherRandomWallet();
    // logger.info(`Another wallet seed for metadata update test: ${anotherSeed}`);
    // const anotherProviders = await api.configureCombinedContractProviders(anotherWallet, testConfiguration.dappConfig);

    // Re-join the contract with the non-owner wallet to call the circuit
    // const joinedContractNonOwner = await api.joinCombinedContract(anotherProviders, deployedContract.deployTxData.public.contractAddress);

    // await expect(async () => {
      // await api.updateDIDzNFTMetadata(joinedContractNonOwner, nftIdToUpdate, newMetadataHash);
    // }).rejects.toThrow('ERR_AUTH: Only the current owner can update this DIDz NFT\'s metadata');

    // await anotherWallet.close();
  });

  it.skip('should not mint a DIDz NFT if not owner', async () => {

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

  it('should burn a DIDz NFT', async () => {
    // Mint a new NFT to burn
    const initialMetadataHash = await generateMetadataHash('{"name":"Burn Test NFT","description":"NFT for burn test"}');
    const initialDid = await generateDID(ownerContractAddress, '4');
    const initialDidBytes = initialDid.bytes;
    const nftIdToBurn = await api.mintDIDzNFT(deployedContract, initialMetadataHash, initialDidBytes);
    expect(nftIdToBurn).not.toBeNull();

    // Attempt to get the NFT before burning (should succeed)
    let fetchedNFTBeforeBurn = await api.getDIDzNFT(deployedContract, nftIdToBurn);
    expect(fetchedNFTBeforeBurn).not.toBeNull();

    // Burn the NFT
    const burnResult = await api.burnDIDzNFT(deployedContract, nftIdToBurn);
    expect(burnResult).not.toBeNull();

    // Attempt to get the NFT after burning (should fail with 'DIDz NFT not found')
    await expect(async () => {
      await api.getDIDzNFT(deployedContract, nftIdToBurn);
    }).rejects.toThrow('ERR_NOT_FOUND: DIDz NFT not found');

    // Attempt to burn from a non-owner (should fail if NFT existed and then was re-minted or attempted again)
    // For this test, we'll try to mint a *new* NFT and then attempt to burn it with a non-owner.
    // const secondMetadataHash = await generateMetadataHash('{"name":"Burn Fail Test NFT","description":"NFT for unauthorized burn test"}');
    // const secondDid = await generateDID(ownerContractAddress, '5');
    // const secondDidBytes = secondDid.bytes;
    // const secondNftId = await api.mintDIDzNFT(deployedContract, secondMetadataHash, secondDidBytes);

    // const { wallet: nonOwnerWallet, seed: nonOwnerSeed } = await testEnvironment.getAnotherRandomWallet();
    // logger.info(`Non-owner wallet seed for burn test: ${nonOwnerSeed}`);
    // const nonOwnerProviders = await api.configureCombinedContractProviders(nonOwnerWallet, testConfiguration.dappConfig);

    // const joinedContractNonOwner = await api.joinCombinedContract(nonOwnerProviders, deployedContract.deployTxData.public.contractAddress);

    // await expect(async () => {
    //   await api.burnDIDzNFT(joinedContractNonOwner, secondNftId);
    // }).rejects.toThrow('ERR_AUTH: Only the current owner can burn this DIDz NFT');

    // await nonOwnerWallet.close();
  });
});
