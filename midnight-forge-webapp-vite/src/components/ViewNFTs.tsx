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
    timeout: 60000,
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
      console.log('Metadata hash:', nft.metadataHash);
      
      // Convert metadata hash to IPFS CID (remove 0x prefix and convert to base58)
      // For now, we'll try to fetch it as a direct hash
      const metadataHashWithoutPrefix = nft.metadataHash.startsWith('0x') 
        ? nft.metadataHash.slice(2) 
        : nft.metadataHash;
      
      // Try to fetch metadata from IPFS using the hash as CID
      // This is a simplified approach - in production you might need more sophisticated hash conversion
      try {
        const metadata = await PinataService.fetchFromIPFS(metadataHashWithoutPrefix);
        setNftMetadata(metadata);
      } catch (ipfsError) {
        console.warn('Failed to fetch from IPFS using hash as CID:', ipfsError);
        // If direct hash doesn't work, show basic info
        setNftMetadata({
          name: `NFT #${nft.nftId}`,
          description: 'Metadata not available via IPFS',
          image: '',
          attributes: [
            { trait_type: 'Metadata Hash', value: nft.metadataHash },
            { trait_type: 'Owner Address', value: nft.ownerAddress },
            { trait_type: 'DID', value: nft.did }
          ]
        });
      }
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
                  <div className={styles.nftId}>#{nft.nftId}</div>
                  <div className={styles.nftPreview}>
                    <div className={styles.nftIcon}>🎨</div>
                    <div className={styles.nftHash}>{nft.metadataHash.slice(0, 8)}...</div>
                  </div>
                  <div className={styles.nftOwner}>
                    Owner: {nft.ownerAddress.slice(0, 8)}...
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
                      <h5>Attributes:</h5>
                      {nftMetadata.attributes.map((attr, index) => (
                        <div key={index} className={styles.attribute}>
                          <span className={styles.traitType}>{attr.trait_type}:</span>
                          <span className={styles.traitValue}>{attr.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className={styles.technicalDetails}>
                      <h5>Technical Details:</h5>
                      <div className={styles.techDetail}>
                        <span>NFT ID:</span>
                        <span>{selectedNft.nftId}</span>
                      </div>
                      <div className={styles.techDetail}>
                        <span>Owner Address:</span>
                        <span className={styles.address}>{selectedNft.ownerAddress}</span>
                      </div>
                      <div className={styles.techDetail}>
                        <span>Metadata Hash:</span>
                        <span className={styles.hash}>{selectedNft.metadataHash}</span>
                      </div>
                      <div className={styles.techDetail}>
                        <span>DID:</span>
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