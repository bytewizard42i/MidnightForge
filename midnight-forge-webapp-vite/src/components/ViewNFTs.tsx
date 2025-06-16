import React, { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { MidnightForgeClient } from '../services/MidnightForgeClient';
import PinataService from '../services/PinataService';
import styles from './ViewNFTs.module.css';

interface NFT {
  nftId: number;
  ownerAddress: string;
  metadataHash: string;
  did: string;
}

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface ViewNFTsProps {
  contractAddress?: string;
}

const ViewNFTs: React.FC<ViewNFTsProps> = ({ contractAddress }) => {
  const [inputContractAddress, setInputContractAddress] = useState<string>('');
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  const [nftMetadata, setNftMetadata] = useState<NFTMetadata | null>(null);
  const [metadataLoading, setMetadataLoading] = useState<boolean>(false);
  const [showMutabilityPanel, setShowMutabilityPanel] = useState<boolean>(false);

  // Initialize Midnight Forge client
  const midnightClient = new MidnightForgeClient({
    baseUrl: 'http://localhost:3001',
    timeout: 300000, // 5 minutes to match server timeout
  });

  const targetContractAddress = contractAddress || inputContractAddress;

  const loadNFTs = async () => {
    if (!targetContractAddress) {
      setError('Please provide a contract address');
      return;
    }

    setLoading(true);
    setError('');
    setNfts([]);

    try {
      console.log('Loading NFTs for contract:', targetContractAddress);
      const response = await midnightClient.listNFTs(targetContractAddress);
      
      if (response.success && response.data) {
        setNfts(response.data.nfts);
        console.log(`Loaded ${response.data.nfts.length} NFTs`);
      } else {
        setError(response.error || 'Failed to load NFTs');
      }
    } catch (error) {
      console.error('Error loading NFTs:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadNFTMetadata = async (nft: NFT) => {
    setMetadataLoading(true);
    setNftMetadata(null);

    try {
      console.log('Loading metadata for NFT:', nft.nftId);
      console.log('Metadata hash (verification hash):', nft.metadataHash);
      
      // The metadataHash is a SHA-256 verification hash, not an IPFS CID
      // We need to reconstruct the metadata structure based on available data
      // In a real implementation, you would either:
      // 1. Store IPFS CIDs separately on-chain, or
      // 2. Have a mapping service that maps hashes to IPFS CIDs, or
      // 3. Use the hash to verify metadata fetched from a known source
      
      // For now, create a basic metadata structure with available on-chain data
      const basicMetadata: NFTMetadata = {
        name: `DIDz NFT #${nft.nftId}`,
        description: `A DIDz NFT minted on the Midnight blockchain. This NFT represents a decentralized identity with verifiable metadata.`,
        image: '', // No image available without IPFS CID
        attributes: [
          { trait_type: 'NFT ID', value: nft.nftId.toString() },
          { trait_type: 'Metadata Hash', value: nft.metadataHash },
          { trait_type: 'Owner Address', value: nft.ownerAddress },
          { trait_type: 'DID', value: nft.did },
          { trait_type: 'Blockchain', value: 'Midnight' },
          { trait_type: 'Contract Type', value: 'DIDz NFT' }
        ]
      };

      // TODO: In a future version, implement proper metadata decoding:
      // 1. If you have a mapping service: const ipfsCid = await getMappingService().getCidForHash(nft.metadataHash);
      // 2. If IPFS CID is stored on-chain: fetch it from the contract
      // 3. If you have the original metadata: verify it using the hash
      
      console.log('Generated basic metadata structure for NFT', nft.nftId);
      setNftMetadata(basicMetadata);
      
    } catch (error) {
      console.error('Error loading NFT metadata:', error);
      setError(error instanceof Error ? error.message : 'Failed to load metadata');
    } finally {
      setMetadataLoading(false);
    }
  };

  const handleNFTSelect = (nft: NFT) => {
    setSelectedNft(nft);
    loadNFTMetadata(nft);
    setShowMutabilityPanel(false); // Reset mutability panel when selecting new NFT
  };

  const handleRefresh = () => {
    loadNFTs();
    setSelectedNft(null);
    setNftMetadata(null);
    setShowMutabilityPanel(false);
  };

  // Auto-load NFTs when contract address is provided
  useEffect(() => {
    if (contractAddress) {
      loadNFTs();
    }
  }, [contractAddress]);

  const renderMutabilityPanel = () => {
    if (!selectedNft || !showMutabilityPanel) return null;

    return (
      <div className={styles.mutabilityPanel}>
        <h3>🔧 NFT Mutability Actions</h3>
        <div className={styles.mutabilityActions}>
          <button 
            className={`${styles.actionButton} ${styles.updateMetadata}`}
            onClick={() => alert('Update Metadata feature coming soon!')}
          >
            📝 Update Metadata
          </button>
          <button 
            className={`${styles.actionButton} ${styles.transferNft}`}
            onClick={() => alert('Transfer NFT feature coming soon!')}
          >
            🔄 Transfer Ownership
          </button>
          <button 
            className={`${styles.actionButton} ${styles.burnNft}`}
            onClick={() => alert('Burn NFT feature coming soon!')}
          >
            🔥 Burn NFT
          </button>
        </div>
        <p className={styles.mutabilityNote}>
          💡 These mutability features will be implemented in the next phase. 
          They will use the smart contract's updateDIDzNFTMetadata, transferDIDzNFT, and burnDIDzNFT circuits.
        </p>
      </div>
    );
  };

  return (
    <div className={styles.viewNftsContainer}>
      <div className={styles.viewNftsHeader}>
        <h2>🎨 View & Manage NFTs</h2>
        <p>Browse and manage your DIDz NFTs on the Midnight blockchain</p>
      </div>

      {!contractAddress && (
        <div className={styles.contractInputSection}>
          <label htmlFor="contractAddress">Contract Address:</label>
          <div className={styles.inputGroup}>
            <input
              id="contractAddress"
              type="text"
              value={inputContractAddress}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setInputContractAddress(e.target.value)}
              placeholder="Enter contract address..."
              className={styles.contractAddressInput}
            />
            <button 
              onClick={loadNFTs}
              disabled={loading || !inputContractAddress}
              className={styles.loadButton}
            >
              {loading ? '⏳ Loading...' : '🔍 Load NFTs'}
            </button>
          </div>
        </div>
      )}

      {targetContractAddress && (
        <div className={styles.contractInfo}>
          <strong>Contract:</strong> {targetContractAddress}
          <button onClick={handleRefresh} className={styles.refreshButton} disabled={loading}>
            🔄 Refresh
          </button>
        </div>
      )}

      {error && (
        <div className={styles.errorMessage}>
          ❌ {error}
        </div>
      )}

      <div className={styles.nftsContent}>
        {/* NFT List Panel */}
        <div className={styles.nftsListPanel}>
          <h3>📋 NFTs in Contract ({nfts.length})</h3>
          
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading NFTs...</p>
            </div>
          ) : nfts.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No NFTs found in this contract</p>
              {targetContractAddress && (
                <small>Make sure the contract address is correct and NFTs have been minted</small>
              )}
            </div>
          ) : (
            <div className={styles.nftsGrid}>
              {nfts.map((nft) => (
                <div
                  key={nft.nftId}
                  className={`${styles.nftCard} ${selectedNft?.nftId === nft.nftId ? styles.selected : ''}`}
                  onClick={() => handleNFTSelect(nft)}
                >
                  <div className={styles.nftPreview}>🎨</div>
                  <div className={styles.nftInfo}>
                    <div className={styles.nftId}>DIDz NFT #{nft.nftId}</div>
                    <div className={styles.nftHash}>{nft.metadataHash.slice(0, 16)}...</div>
                    <div className={styles.nftOwner}>Owner: {nft.ownerAddress.slice(0, 12)}...</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NFT Details Panel */}
        <div className={styles.nftDetailsPanel}>
          {selectedNft ? (
            <>
              <div className={styles.nftDetailsHeader}>
                <h3>🔍 NFT #{selectedNft.nftId} Details</h3>
                <button
                  onClick={() => setShowMutabilityPanel(!showMutabilityPanel)}
                  className={styles.mutabilityToggle}
                >
                  {showMutabilityPanel ? '❌ Close Actions' : '🔧 Show Actions'}
                </button>
              </div>

              {metadataLoading ? (
                <div className={styles.loadingState}>
                  <div className={styles.spinner}></div>
                  <p>Loading metadata...</p>
                </div>
              ) : nftMetadata ? (
                <div className={styles.nftMetadata}>
                  <div className={styles.metadataImage}>
                    {nftMetadata.image ? (
                      <img 
                        src={nftMetadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')} 
                        alt={nftMetadata.name}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className={styles.placeholderImage}>🎨</div>
                    )}
                  </div>
                  
                  <div className={styles.metadataInfo}>
                    <h4>{nftMetadata.name}</h4>
                    <p className={styles.description}>{nftMetadata.description}</p>
                    
                    <div className={styles.attributes}>
                      <h5>Attributes</h5>
                      {nftMetadata.attributes.map((attr, index) => (
                        <div key={index} className={styles.attribute}>
                          <span className={styles.traitType}>{attr.trait_type}</span>
                          <span className={styles.traitValue}>{attr.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className={styles.technicalDetails}>
                      <h5>Technical Details</h5>
                      <div className={styles.techDetail}>
                        <span>NFT ID</span>
                        <span>{selectedNft.nftId}</span>
                      </div>
                      <div className={styles.techDetail}>
                        <span>Owner Address</span>
                        <span className={styles.address}>{selectedNft.ownerAddress}</span>
                      </div>
                      <div className={styles.techDetail}>
                        <span>Metadata Hash</span>
                        <span className={styles.hash}>{selectedNft.metadataHash}</span>
                      </div>
                      <div className={styles.techDetail}>
                        <span>DID</span>
                        <span className={styles.hash}>{selectedNft.did}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.noMetadata}>
                  <p>Failed to load metadata</p>
                </div>
              )}

              {renderMutabilityPanel()}
            </>
          ) : (
            <div className={styles.noSelection}>
              <div className={styles.placeholderIcon}>👆</div>
              <p>Select an NFT from the list to view its details</p>
              <small>Click on any NFT card to see its metadata and available actions</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewNFTs; 