// src/services/PinataService.ts
// Service for Pinata IPFS interactions.
// Make sure to set your Pinata API keys in environment variables:
// REACT_APP_PINATA_API_KEY and REACT_APP_PINATA_SECRET_API_KEY

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_API_KEY = import.meta.env.VITE_PINATA_SECRET_API_KEY;
const PINATA_UPLOAD_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
const PINATA_JSON_UPLOAD_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';

class PinataService {
  private getAuthHeaders() {
    return {
      'pinata_api_key': PINATA_API_KEY || '',
      'pinata_secret_api_key': PINATA_SECRET_API_KEY || '',
    };
  }

  private checkApiKeys() {
    if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
      throw new Error(
        'Pinata API keys not found. Please set REACT_APP_PINATA_API_KEY and REACT_APP_PINATA_SECRET_API_KEY in your environment variables.'
      );
    }
  }

  async uploadFile(file: File): Promise<string> {
    this.checkApiKeys();
    
    console.log('Uploading file to Pinata IPFS:', file.name);
    
    const formData = new FormData();
    formData.append('file', file);
    
    // Optional: Add metadata for the file
    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        uploadedBy: 'MidnightForge',
        type: 'NFT-Image'
      }
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', options);

    try {
      const res = await fetch(PINATA_UPLOAD_URL, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Pinata file upload error:', errorText);
        throw new Error(`Pinata file upload failed: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      console.log('File uploaded successfully to IPFS:', data.IpfsHash);
      return data.IpfsHash;
    } catch (error) {
      console.error('Error uploading file to Pinata:', error);
      throw error;
    }
  }

  async uploadJson(json: any): Promise<string> {
    this.checkApiKeys();
    
    console.log('Uploading JSON metadata to Pinata IPFS');
    
    const body = {
      pinataContent: json,
      pinataMetadata: {
        name: 'NFT-Metadata.json',
        keyvalues: {
          uploadedBy: 'MidnightForge',
          type: 'NFT-Metadata'
        }
      },
      pinataOptions: {
        cidVersion: 0
      }
    };

    try {
      const res = await fetch(PINATA_JSON_UPLOAD_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Pinata JSON upload error:', errorText);
        throw new Error(`Pinata JSON upload failed: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      console.log('JSON uploaded successfully to IPFS:', data.IpfsHash);
      return data.IpfsHash;
    } catch (error) {
      console.error('Error uploading JSON to Pinata:', error);
      throw error;
    }
  }

  // Helper method to test if API keys are working
  async testConnection(): Promise<boolean> {
    try {
      this.checkApiKeys();
      
      const testData = { test: 'connection', timestamp: Date.now() };
      const cid = await this.uploadJson(testData);
      console.log('Pinata connection test successful, CID:', cid);
      return true;
    } catch (error) {
      console.error('Pinata connection test failed:', error);
      return false;
    }
  }
}

const pinataServiceInstance = new PinataService();
export default pinataServiceInstance; 