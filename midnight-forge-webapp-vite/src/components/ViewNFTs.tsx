import React, { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { MidnightForgeClient } from '../services/MidnightForgeClient';
import PinataService from '../services/PinataService';
import styles from './ViewNFTs.module.css';

interface NFT {
  nftId: number;
  ownerAddress: string;
  metadataHash: string;
  metadataCID: string;
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
      // We can optionally load metadata here by adding ?includeMetadata=true
      const response = await midnightClient.listNFTs(targetContractAddress);
      
      if (response.success && response.data) {
        // Ensure all NFTs have the required metadataCID field (fallback for older data)
        const nftsWithCID = response.data.nfts.map(nft => ({
          ...nft,
          metadataCID: (nft as any).metadataCID || '' // Fallback for compatibility
        }));
        setNfts(nftsWithCID);
        console.log(`Loaded ${nftsWithCID.length} NFTs with CIDs:`, nftsWithCID.map(n => ({ id: n.nftId, cid: n.metadataCID })));
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
      console.log('Metadata CID:', nft.metadataCID);
      console.log('Metadata hash (verification hash):', nft.metadataHash);
      
      if (nft.metadataCID) {
        // Fetch the actual metadata from IPFS using the stored CID
        try {
          const metadata = await PinataService.fetchFromIPFS(nft.metadataCID);
          console.log('✅ Successfully fetched metadata from IPFS:', metadata);
          
          // Add technical details as additional attributes
          const enhancedMetadata: NFTMetadata = {
            ...metadata,
            attributes: [
              ...metadata.attributes,
              { trait_type: 'NFT ID', value: nft.nftId.toString() },
              { trait_type: 'Metadata Hash', value: nft.metadataHash },
              { trait_type: 'Metadata CID', value: nft.metadataCID },
              { trait_type: 'Owner Address', value: nft.ownerAddress },
              { trait_type: 'DID', value: nft.did },
              { trait_type: 'Blockchain', value: 'Midnight' },
              { trait_type: 'Contract Type', value: 'DIDz NFT' }
            ]
          };
          
          setNftMetadata(enhancedMetadata);
          return;
        } catch (ipfsError) {
          console.warn('⚠️ Failed to fetch metadata from IPFS, falling back to basic metadata:', ipfsError);
        }
      }
      
      // Fallback: create basic metadata structure with available on-chain data
      const basicMetadata: NFTMetadata = {
        name: `DIDz NFT #${nft.nftId}`,
        description: `A DIDz NFT minted on the Midnight blockchain. This NFT represents a decentralized identity with verifiable metadata.`,
        image: '', // No image available without IPFS CID
        attributes: [
          { trait_type: 'NFT ID', value: nft.nftId.toString() },
          { trait_type: 'Metadata Hash', value: nft.metadataHash },
          { trait_type: 'Metadata CID', value: nft.metadataCID || 'Not available' },
          { trait_type: 'Owner Address', value: nft.ownerAddress },
          { trait_type: 'DID', value: nft.did },
          { trait_type: 'Blockchain', value: 'Midnight' },
          { trait_type: 'Contract Type', value: 'DIDz NFT' },
          { trait_type: 'Status', value: 'Metadata not accessible' }
        ]
      };
      
      console.log('Using fallback metadata structure for NFT', nft.nftId);
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

    const handleMockAction = (actionName: string, description: string) => {
      alert(`🚧 MOCK ACTION: ${actionName}\n\n${description}\n\nThis is a placeholder - actual implementation coming soon!`);
    };

    return (
      <div className={styles.mutabilityPanel}>
        <h3>🔧 NFT Management Actions</h3>
        
        {/* Metadata Management */}
        <div className={styles.actionSection}>
          <h4>📝 Metadata Management</h4>
          <div className={styles.mutabilityActions}>
            <button 
              className={`${styles.actionButton} ${styles.updateMetadata}`}
              onClick={() => handleMockAction('Update Metadata', 
                'Would call updateDIDzNFTMetadata circuit to:\n• Upload new metadata to IPFS\n• Update metadata hash on-chain\n• Verify ownership before update')}
            >
              📝 Update Metadata
            </button>
            <button 
              className={`${styles.actionButton} ${styles.updateImage}`}
              onClick={() => handleMockAction('Update Image', 
                'Would allow updating just the image:\n• Upload new image to IPFS\n• Update metadata with new image CID\n• Preserve other metadata fields')}
            >
              🖼️ Update Image
            </button>
            <button 
              className={`${styles.actionButton} ${styles.updateAttributes}`}
              onClick={() => handleMockAction('Update Attributes', 
                'Would allow modifying NFT attributes:\n• Edit trait types and values\n• Add new attributes\n• Remove existing attributes')}
            >
              🏷️ Edit Attributes
            </button>
          </div>
        </div>

        {/* Ownership Management */}
        <div className={styles.actionSection}>
          <h4>👤 Ownership Management</h4>
          <div className={styles.mutabilityActions}>
            <button 
              className={`${styles.actionButton} ${styles.transferNft}`}
              onClick={() => handleMockAction('Transfer Ownership', 
                'Would call transferDIDzNFT circuit to:\n• Verify current ownership\n• Transfer to new DID and address\n• Update ownership mappings')}
            >
              🔄 Transfer NFT
            </button>
            <button 
              className={`${styles.actionButton} ${styles.delegateAccess}`}
              onClick={() => handleMockAction('Delegate Access', 
                'Would set temporary access permissions:\n• Grant specific permissions\n• Set time-limited access\n• Maintain ownership')}
            >
              👥 Delegate Access
            </button>
            <button 
              className={`${styles.actionButton} ${styles.revokeAccess}`}
              onClick={() => handleMockAction('Revoke Access', 
                'Would remove delegated permissions:\n• Revoke specific permissions\n• Cancel time-limited access\n• Restore full owner control')}
            >
              🚫 Revoke Access
            </button>
          </div>
        </div>

        {/* Advanced Actions */}
        <div className={styles.actionSection}>
          <h4>⚙️ Advanced Actions</h4>
          <div className={styles.mutabilityActions}>
            <button 
              className={`${styles.actionButton} ${styles.freezeNft}`}
              onClick={() => handleMockAction('Freeze NFT', 
                'Would make NFT temporarily immutable:\n• Prevent transfers\n• Lock metadata changes\n• Maintain visibility')}
            >
              🧊 Freeze NFT
            </button>
            <button 
              className={`${styles.actionButton} ${styles.unfreezeNft}`}
              onClick={() => handleMockAction('Unfreeze NFT', 
                'Would restore NFT mutability:\n• Re-enable transfers\n• Allow metadata updates\n• Restore full functionality')}
            >
              🔥 Unfreeze NFT
            </button>
            <button 
              className={`${styles.actionButton} ${styles.burnNft}`}
              onClick={() => handleMockAction('Burn NFT', 
                'Would permanently destroy this NFT:\n⚠️ IRREVERSIBLE ACTION\n• Remove from contract\n• Clear all mappings\n• Cannot be undone')}
            >
              🔥 Burn NFT
            </button>
          </div>
        </div>

        {/* DID Management */}
        <div className={styles.actionSection}>
          <h4>🆔 DID Management</h4>
          <div className={styles.mutabilityActions}>
            <button 
              className={`${styles.actionButton} ${styles.updateDid}`}
              onClick={() => handleMockAction('Update DID', 
                'Would update the associated DID:\n• Generate new DID\n• Maintain ownership\n• Update DID mappings')}
            >
              🆔 Update DID
            </button>
            <button 
              className={`${styles.actionButton} ${styles.linkExternalDid}`}
              onClick={() => handleMockAction('Link External DID', 
                'Would link to external DID system:\n• Connect to other DID networks\n• Maintain cross-chain identity\n• Enable interoperability')}
            >
              🔗 Link External DID
            </button>
          </div>
        </div>

        {/* Current NFT Info Summary */}
        <div className={styles.nftSummary}>
          <h4>🔍 Current NFT Status</h4>
          <div className={styles.statusGrid}>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Status:</span>
              <span className={styles.statusValue}>✅ Active</span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Transferable:</span>
              <span className={styles.statusValue}>✅ Yes</span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Mutable:</span>
              <span className={styles.statusValue}>✅ Yes</span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Last Updated:</span>
              <span className={styles.statusValue}>At mint</span>
            </div>
          </div>
        </div>

        <div className={styles.implementationNote}>
          <h4>🚧 Implementation Status</h4>
          <p>
            <strong>These are MOCK ACTIONS for UI demonstration purposes.</strong>
          </p>
          <p>
            The actual implementations will use the smart contract circuits:
          </p>
          <ul>
            <li><code>updateDIDzNFTMetadata()</code> - Update metadata</li>
            <li><code>transferDIDzNFT()</code> - Transfer ownership</li>
            <li><code>burnDIDzNFT()</code> - Burn/destroy NFT</li>
            <li>Additional circuits for freeze/unfreeze functionality</li>
          </ul>
          <p>
            <em>Coming in the next development phase! 🚀</em>
          </p>
        </div>
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
                    <div className={styles.nftHash}>Hash: {nft.metadataHash.slice(0, 16)}...</div>
                    <div className={styles.nftCid}>CID: {nft.metadataCID ? nft.metadataCID.slice(0, 16) + '...' : 'N/A'}</div>
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