import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import PinataService from '../services/PinataService';

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

const CreateMetadataForm: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [attributes, setAttributes] = useState<Attribute[]>([{ trait_type: '', value: '' }]);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {

  }, []);

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
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setError(''); // Clear any previous errors
    } else {
      setImageFile(null);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setImageFile(null);
    setAttributes([{ trait_type: '', value: '' }]);
    setStatusMessage('');
    setError('');
    setSuccess(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage('Starting metadata creation...');
    setError('');
    setSuccess(false);

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
      // with a gateway url
        // --- New Gateway Links ---
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

      setStatusMessage(`✅ Success! Metadata Hash: ${metadataHash}`);
      setSuccess(true);

      // In a real app, you would now send metadataHash and other info to your Midnight contract's mint circuit
      // For now, we'll just show a success message.

    } catch (error: any) {
      console.error('Error creating metadata:', error);
      setError(error.message);
      setStatusMessage('❌ Failed to create metadata. See error below.');
    } finally {
      setLoading(false);
    }
  };

  // Check if API keys are likely configured
  const hasApiKeys = process.env.REACT_APP_PINATA_API_KEY && 
                    process.env.REACT_APP_PINATA_SECRET_API_KEY &&
                    process.env.REACT_APP_PINATA_API_KEY !== 'your_pinata_api_key_here';

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
            <br /><code>REACT_APP_PINATA_API_KEY=your_api_key</code>
            <br /><code>REACT_APP_PINATA_SECRET_API_KEY=your_secret_key</code>
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

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            type="submit"
            disabled={loading || !hasApiKeys}
            style={{ 
              padding: '12px 20px', 
              borderRadius: '4px', 
              border: 'none', 
              backgroundColor: loading || !hasApiKeys ? '#6c757d' : '#28a745', 
              color: 'white', 
              fontSize: '16px', 
              cursor: loading || !hasApiKeys ? 'not-allowed' : 'pointer',
              flex: 1
            }}
          >
            {loading ? 'Creating Metadata...' : 'Create Metadata'}
          </button>
          
          {success && (
            <button
              type="button"
              onClick={resetForm}
              style={{ 
                padding: '12px 20px', 
                borderRadius: '4px', 
                border: '1px solid #007bff', 
                backgroundColor: 'white', 
                color: '#007bff', 
                fontSize: '16px', 
                cursor: 'pointer'
              }}
            >
              Create Another
            </button>
          )}
        </div>
      </form>

      {statusMessage && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: success ? '#d4edda' : error ? '#f8d7da' : '#e9ecef', 
          borderRadius: '4px', 
          border: `1px solid ${success ? '#c3e6cb' : error ? '#f5c6cb' : '#ced4da'}`,
          wordWrap: 'break-word' 
        }}>
          <strong>Status:</strong> {statusMessage}
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