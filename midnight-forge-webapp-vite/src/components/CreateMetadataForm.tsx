import React, { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import PinataService from '../services/PinataService';
import { MidnightForgeClient } from '../services/MidnightForgeClient';
import { generateDID } from '../utils/nftUtils';

// Helper to calculate SHA-256 hash
async function calculateSha256(data: string): Promise<string> {
  const textEncoder = new TextEncoder();
  const dataBuffer = textEncoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hexHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hexHash;
}

interface Attribute {
  trait_type: string;
  value: string;
}

interface NFTMetadata {
  name: string;
  description: string;
  image: string; // IPFS URI
  attributes: Attribute[];
}

interface CreateMetadataFormProps {
  contractAddress?: string; // Optional contract address from parent
  onMintSuccess?: () => void; // Optional callback when NFT is minted successfully
}

const CreateMetadataForm: React.FC<CreateMetadataFormProps> = ({ contractAddress, onMintSuccess }) => {
  const [name, setName] = useState<string>('Admin Role NFT');
  const [description, setDescription] = useState<string>('This is an Admin Role NFT');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null); // New state for image preview
  const [attributes, setAttributes] = useState<Attribute[]>([{ trait_type: 'Role', value: 'Admin' }]);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  
  // NFT minting state
  const [shouldMintNFT, setShouldMintNFT] = useState<boolean>(true);
  const [inputContractAddress, setInputContractAddress] = useState<string>('');
  const [mintedNFTId, setMintedNFTId] = useState<number | null>(null);
  const [mintTransactionId, setMintTransactionId] = useState<string | null>(null);

  // Initialize Midnight Forge client
  const midnightClient = new MidnightForgeClient({
    baseUrl: 'http://localhost:3001',
    timeout: 120000, // 2 minutes for minting operations
  });

  useEffect(() => {
    // Cleanup the object URL when component unmounts or imageFile changes
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const handleAttributeChange = (index: number, field: keyof Attribute, value: string) => {
    const newAttributes = [...attributes];
    newAttributes[index][field] = value;
    setAttributes(newAttributes);
  };

  const addAttribute = () => {
    setAttributes([...attributes, { trait_type: '', value: '' }]);
  };

  const removeAttribute = (index: number) => {
    const newAttributes = attributes.filter((_, i) => i !== index);
    setAttributes(newAttributes);
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (imagePreviewUrl) { // Revoke previous URL if exists
      URL.revokeObjectURL(imagePreviewUrl);
    }

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file)); // Create URL for preview
      setError(''); // Clear any previous errors
    } else {
      setImageFile(null);
      setImagePreviewUrl(null);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setImageFile(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(null);
    setAttributes([{ trait_type: '', value: '' }]);
    setStatusMessage('');
    setError('');
    setSuccess(false);
    setMintedNFTId(null);
    setMintTransactionId(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage('Starting metadata creation...');
    setError('');
    setSuccess(false);
    setMintedNFTId(null);
    setMintTransactionId(null);

    try {
      if (!imageFile) {
        throw new Error('Please select an image file.');
      }

      // Validate file size (max 10MB)
      if (imageFile.size > 10 * 1024 * 1024) {
        throw new Error('Image file is too large. Please select a file smaller than 10MB.');
      }

      // Validate file type
      if (!imageFile.type.startsWith('image/')) {
        throw new Error('Please select a valid image file.');
      }

      // Validate contract address if minting is enabled
      const targetContractAddress = contractAddress || inputContractAddress;
      if (shouldMintNFT && !targetContractAddress) {
        throw new Error('Please provide a contract address to mint the NFT.');
      }

      // 1. Upload Image to IPFS
      setStatusMessage('Uploading image to IPFS...');
      const imageCid = await PinataService.uploadFile(imageFile);
      const ipfsImageUri = `ipfs://${imageCid}`;
      setStatusMessage(`✅ Image uploaded: ${ipfsImageUri}`);

      // 2. Construct NFT Metadata JSON
      const metadata: NFTMetadata = {
        name: name.trim(),
        description: description.trim(),
        image: ipfsImageUri,
        attributes: attributes.filter(attr => attr.trait_type.trim() && attr.value.trim()), // Filter empty attributes
      };

      console.log('Metadata:', metadata);

      // 3. Upload Metadata JSON to IPFS
      setStatusMessage('Uploading metadata JSON to IPFS...');
      const metadataCid = await PinataService.uploadJson(metadata);
      const ipfsMetadataUri = `ipfs://${metadataCid}`;
      setStatusMessage(`✅ Metadata JSON uploaded: ${ipfsMetadataUri}`);

      // 4. Calculate SHA-256 hash of the metadata JSON
      const metadataJsonString = JSON.stringify(metadata);
      const metadataHash = await calculateSha256(metadataJsonString);
      
      console.log('=== NFT Metadata Creation Summary ===');
      console.log('Image CID:', imageCid);
      console.log('Image IPFS URI:', ipfsImageUri);
      console.log('Metadata CID:', metadataCid);
      console.log('Metadata IPFS URI:', ipfsMetadataUri);
      // with a gateway url // log links so we can see them in the console
      console.log('--- Gateway Links ---');
      console.log('Image (ipfs.io): ', `https://ipfs.io/ipfs/${imageCid}`);
      console.log('Metadata (ipfs.io): ', `https://ipfs.io/ipfs/${metadataCid}`);
      console.log('Image (nftstorage.link): ', `https://nftstorage.link/ipfs/${imageCid}`);
      console.log('Metadata (nftstorage.link): ', `https://nftstorage.link/ipfs/${metadataCid}`);
      console.log('Image (cloudflare-ipfs.com): ', `https://cloudflare-ipfs.com/ipfs/${imageCid}`);
      console.log('Metadata (cloudflare-ipfs.com): ', `https://cloudflare-ipfs.com/ipfs/${metadataCid}`);
      console.log('Image (dweb.link): ', `https://dweb.link/ipfs/${imageCid}`);
      console.log('Metadata (dweb.link): ', `https://dweb.link/ipfs/${metadataCid}`);
      console.log('---------------------');
      console.log('Metadata Hash (SHA-256):', metadataHash);
      console.log('Generated Metadata:', metadata);
      console.log('=====================================');

      // 5. Mint NFT if enabled
      if (shouldMintNFT && targetContractAddress) {
        setStatusMessage('🎨 Minting NFT on Midnight blockchain...');
        
        // Generate a DID for this NFT (using a timestamp for uniqueness)
        const uniqueId = `nft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const did = await generateDID(targetContractAddress, uniqueId);
        
        console.log('=== NFT Minting Details ===');
        console.log('Contract Address:', targetContractAddress);
        console.log('Metadata Hash:', metadataHash);
        console.log('Generated DID:', did);
        console.log('Unique ID used:', uniqueId);
        console.log('===========================');

        try {
          const mintResult = await midnightClient.mintNFT({
            contractAddress: targetContractAddress,
            metadataHash: metadataHash,
            did: did,
          });

          if (mintResult.success && mintResult.data) {
            setMintedNFTId(mintResult.data.nftId);
            setMintTransactionId(mintResult.data.transactionId);
            setStatusMessage(`🎉 NFT minted successfully! NFT ID: ${mintResult.data.nftId}`);
            console.log('✅ NFT Minted Successfully:', mintResult.data);
            
            // Call the success callback if provided
            if (onMintSuccess) {
              onMintSuccess();
            }
          } else {
            throw new Error(mintResult.error || 'Failed to mint NFT');
          }
        } catch (mintError: any) {
          console.error('❌ NFT Minting Error:', mintError);
          setStatusMessage(`✅ Metadata created successfully, but NFT minting failed: ${mintError.message}`);
          // Don't throw here - metadata creation was successful
        }
      } else {
        setStatusMessage(`✅ Success! Metadata Hash: ${metadataHash}`);
      }

      setSuccess(true);

    } catch (error: any) {
      console.error('Error creating metadata:', error);
      setError(error.message);
      setStatusMessage('❌ Failed to create metadata. See error below.');
    } finally {
      setLoading(false);
    }
  };

  // Check if API keys are likely configured
  const hasApiKeys = import.meta.env.VITE_PINATA_API_KEY && 
                    import.meta.env.VITE_PINATA_SECRET_API_KEY &&
                    import.meta.env.VITE_PINATA_API_KEY !== 'your_pinata_api_key_here';

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: 'auto', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '2px 2px 10px rgba(0,0,0,0.1)' }}>
      <h2>Create DIDz NFT Metadata</h2>
      
      {!hasApiKeys && (
        <div style={{ padding: '15px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px', marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>⚠️ Pinata API Keys Required</h4>
          <p style={{ margin: '0', color: '#856404', fontSize: '14px' }}>
            To upload files to IPFS, you need to:
            <br />1. Create a free account at <a href="https://app.pinata.cloud" target="_blank" rel="noopener noreferrer">pinata.cloud</a>
            <br />2. Generate API keys in your Pinata dashboard
            <br />3. Create a <code>.env</code> file in your project root with:
            <br /><code>VITE_PINATA_API_KEY=your_api_key</code>
            <br /><code>VITE_PINATA_SECRET_API_KEY=your_secret_key</code>
            <br />4. Restart your development server
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label htmlFor="name" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g., Admin Role NFT"
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        <div>
          <label htmlFor="description" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
            placeholder="Describe this NFT and its role/purpose..."
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          ></textarea>
        </div>

        <div>
          <label htmlFor="image" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>NFT Image:</label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleImageChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
          {imageFile && (
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
              Selected: {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
          {imagePreviewUrl && (
            <div style={{ marginTop: '10px', textAlign: 'center' }}>
              <img src={imagePreviewUrl} alt="Image Preview" style={{ maxWidth: '100%', maxHeight: '200px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
          )}
        </div>

        <h3 style={{ margin: '20px 0 10px 0' }}>Attributes (for Roles & Properties)</h3>
        {attributes.map((attribute, index) => (
          <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Trait Type (e.g., 'Role', 'Level')"
              value={attribute.trait_type}
              onChange={(e) => handleAttributeChange(index, 'trait_type', e.target.value)}
              style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
            <input
              type="text"
              placeholder="Value (e.g., 'Admin', '5')"
              value={attribute.value}
              onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
              style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
            {attributes.length > 1 && (
              <button
                type="button"
                onClick={() => removeAttribute(index)}
                style={{ padding: '8px 12px', borderRadius: '4px', border: 'none', backgroundColor: '#dc3545', color: 'white', cursor: 'pointer' }}
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addAttribute}
          style={{ padding: '10px 15px', borderRadius: '4px', border: 'none', backgroundColor: '#007bff', color: 'white', cursor: 'pointer', alignSelf: 'flex-start' }}
        >
          Add Attribute
        </button>

        {/* NFT Minting Section */}
        <div style={{ 
          marginTop: '30px', 
          padding: '24px', 
          background: 'linear-gradient(135deg, #1f2937, #374151)', 
          borderRadius: '12px', 
          border: '2px solid #4b5563',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
        }}>
          <h3 style={{ 
            margin: '0 0 20px 0', 
            color: 'white', 
            fontSize: '18px',
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
          }}>
            🎨 NFT Minting Options
          </h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              cursor: 'pointer',
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s ease'
            }}>
              <input
                type="checkbox"
                checked={shouldMintNFT}
                onChange={(e) => setShouldMintNFT(e.target.checked)}
                style={{ 
                  transform: 'scale(1.3)',
                  accentColor: '#7c3aed'
                }}
              />
              <span style={{ 
                fontWeight: 'bold', 
                color: 'white',
                fontSize: '16px'
              }}>
                Mint NFT after creating metadata
              </span>
            </label>
            <p style={{ 
              margin: '8px 0 0 44px', 
              fontSize: '14px', 
              color: '#d1d5db',
              lineHeight: '1.5'
            }}>
              Automatically mint the NFT on the Midnight blockchain after uploading metadata to IPFS
            </p>
          </div>

          {shouldMintNFT && !contractAddress && (
            <div style={{
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <label htmlFor="contractAddress" style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: 'bold',
                color: 'white',
                fontSize: '14px'
              }}>
                Contract Address:
              </label>
              <input
                type="text"
                id="contractAddress"
                value={inputContractAddress}
                onChange={(e) => setInputContractAddress(e.target.value)}
                placeholder="Enter the deployed contract address (e.g., 0200a5c7f4aba7f...)"
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  border: '2px solid #4b5563',
                  background: '#1f2937',
                  color: 'white',
                  fontSize: '14px',
                  fontFamily: 'monospace'
                }}
              />
              <p style={{ 
                margin: '8px 0 0 0', 
                fontSize: '12px', 
                color: '#9ca3af',
                lineHeight: '1.4'
              }}>
                You can get this from the Deploy Contract step or use an existing contract address
              </p>
            </div>
          )}

          {shouldMintNFT && contractAddress && (
            <div style={{ 
              padding: '16px', 
              background: 'linear-gradient(135deg, #059669, #10b981)', 
              borderRadius: '8px', 
              border: '2px solid #34d399',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}>
              <p style={{ 
                margin: '0', 
                fontSize: '14px', 
                color: 'white',
                fontWeight: 'bold',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
              }}>
                ✅ <strong>Contract Address:</strong>
              </p>
              <p style={{
                margin: '4px 0 0 0',
                fontSize: '12px',
                color: '#d1fae5',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '8px',
                borderRadius: '4px',
                marginTop: '8px'
              }}>
                {contractAddress}
              </p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            type="submit"
            disabled={loading || !hasApiKeys}
            style={{ 
              padding: '12px 20px', 
              borderRadius: '8px', 
              border: 'none', 
              background: loading || !hasApiKeys 
                ? 'linear-gradient(135deg, #6c757d, #5a6268)' 
                : shouldMintNFT 
                  ? 'linear-gradient(135deg, #7c3aed, #a855f7)' 
                  : 'linear-gradient(135deg, #059669, #10b981)',
              color: 'white', 
              fontSize: '16px', 
              fontWeight: 'bold',
              cursor: loading || !hasApiKeys ? 'not-allowed' : 'pointer',
              flex: 1,
              boxShadow: loading || !hasApiKeys ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s ease'
            }}
          >
            {loading 
              ? (shouldMintNFT ? '🎨 Creating & Minting...' : '📝 Creating Metadata...') 
              : (shouldMintNFT ? '🎨 Create & Mint NFT' : '📝 Create Metadata')
            }
          </button>
          
          {success && (
            <button
              type="button"
              onClick={resetForm}
              style={{ 
                padding: '12px 20px', 
                borderRadius: '8px', 
                border: '2px solid #3b82f6', 
                background: 'linear-gradient(135deg, #1e40af, #3b82f6)', 
                color: 'white', 
                fontSize: '16px', 
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
              }}
            >
              🔄 Create Another
            </button>
          )}
        </div>
      </form>

      {statusMessage && (
        <div style={{ 
          marginTop: '20px', 
          padding: '20px', 
          background: success 
            ? 'linear-gradient(135deg, #1e3a8a, #1e40af)' 
            : error 
              ? 'linear-gradient(135deg, #dc2626, #ef4444)' 
              : 'linear-gradient(135deg, #374151, #4b5563)', 
          borderRadius: '12px', 
          border: `2px solid ${success ? '#3b82f6' : error ? '#f87171' : '#6b7280'}`,
          wordWrap: 'break-word',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)'
        }}>
          <div style={{ 
            color: 'white', 
            fontSize: '16px', 
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
          }}>
            <span style={{ marginRight: '8px' }}>
              {success ? '✅' : error ? '❌' : '⏳'}
            </span>
            {statusMessage}
          </div>
          
          {/* Show NFT minting results */}
          {mintedNFTId !== null && (
            <div style={{ 
              marginTop: '16px', 
              padding: '16px', 
              background: 'linear-gradient(135deg, #059669, #10b981)', 
              borderRadius: '8px', 
              border: '2px solid #34d399',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}>
              <h4 style={{ 
                margin: '0 0 12px 0', 
                color: 'white', 
                fontSize: '18px',
                fontWeight: 'bold',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
              }}>
                🎉 NFT Minted Successfully!
              </h4>
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.1)', 
                padding: '12px', 
                borderRadius: '6px',
                backdropFilter: 'blur(10px)'
              }}>
                <p style={{ 
                  margin: '0 0 8px 0', 
                  fontSize: '14px', 
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  <span style={{ color: '#d1fae5' }}>NFT ID:</span> {mintedNFTId}
                </p>
                {mintTransactionId && (
                  <p style={{ 
                    margin: '0', 
                    fontSize: '12px', 
                    color: '#d1fae5',
                    wordBreak: 'break-all',
                    fontFamily: 'monospace'
                  }}>
                    <span style={{ color: 'white', fontWeight: 'bold' }}>Transaction ID:</span><br/>
                    {mintTransactionId}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ 
          marginTop: '10px', 
          padding: '15px', 
          backgroundColor: '#f8d7da', 
          borderRadius: '4px', 
          border: '1px solid #f5c6cb',
          wordWrap: 'break-word' 
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};

export default CreateMetadataForm; 