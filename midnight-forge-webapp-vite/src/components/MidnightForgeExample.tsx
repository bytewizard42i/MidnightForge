/**
 * Example Component demonstrating how to use the MidnightForge client and hooks
 * 
 * This shows practical usage patterns for:
 * - Server health monitoring
 * - Contract deployment
 * - NFT minting
 * - Error handling
 * - Loading states
 */

import React, { useState } from 'react';
import { useMidnightForge, useMidnightForgeHealth, useMidnightForgeDeployment } from '../hooks/useMidnightForge';

export const MidnightForgeExample: React.FC = () => {
  return (
    <div className="midnight-forge-example">
      <h1>Midnight Forge Server Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ServerHealthPanel />
        <ContractDeploymentPanel />
      </div>
      
      <div className="mt-6">
        <NFTOperationsPanel />
      </div>
      
      <div className="mt-6">
        <BatchOperationsPanel />
      </div>
    </div>
  );
};

// Server Health Monitoring Component
const ServerHealthPanel: React.FC = () => {
  const { health, checkHealth, isLoading, error, isHealthy, isWalletReady } = useMidnightForgeHealth();

  return (
    <div className="panel">
      <h2>Server Health</h2>
      
      <div className="status-indicators">
        <div className={`status-badge ${isHealthy ? 'healthy' : 'unhealthy'}`}>
          {isHealthy ? '✅ Healthy' : '❌ Unhealthy'}
        </div>
        <div className={`status-badge ${isWalletReady ? 'ready' : 'not-ready'}`}>
          {isWalletReady ? '✅ Wallet Ready' : '⏳ Wallet Not Ready'}
        </div>
      </div>

      {health && (
        <div className="health-details">
          <h3>Network Info:</h3>
          <ul>
            <li>Indexer: {health.network.indexer}</li>
            <li>Node: {health.network.node}</li>
            <li>Proof Server: {health.network.proofServer}</li>
          </ul>
          
          <h3>Services:</h3>
          <ul>
            <li>Wallet Connected: {health.wallet.connected ? '✅' : '❌'}</li>
            <li>Wallet Synced: {health.wallet.synced ? '✅' : '❌'}</li>
            <li>Contract Service: {health.contractService.initialized ? '✅' : '❌'}</li>
          </ul>
        </div>
      )}

      {error && <div className="error">Error: {error}</div>}
      
      <button onClick={() => checkHealth()} disabled={isLoading}>
        {isLoading ? 'Checking...' : 'Refresh Health'}
      </button>
    </div>
  );
};

// Contract Deployment Component
const ContractDeploymentPanel: React.FC = () => {
  const { 
    deployContract, 
    lastDeployment, 
    isDeploying, 
    deploymentError, 
    clearDeploymentError,
    lastContractAddress 
  } = useMidnightForgeDeployment();

  const [ownerSecretKey, setOwnerSecretKey] = useState('');
  const [ownerAddress, setOwnerAddress] = useState('');

  const handleDeploy = async () => {
    if (!ownerSecretKey || !ownerAddress) {
      alert('Please provide both owner secret key and address');
      return;
    }

    try {
      const result = await deployContract({
        ownerSecretKey,
        ownerAddress,
      });

      if (result.success) {
        alert(`Contract deployed successfully at: ${result.data?.contractAddress}`);
      } else {
        alert(`Deployment failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Deployment error:', error);
    }
  };

  return (
    <div className="panel">
      <h2>Contract Deployment</h2>
      
      <div className="form-group">
        <label>Owner Secret Key (hex):</label>
        <input
          type="text"
          value={ownerSecretKey}
          onChange={(e) => setOwnerSecretKey(e.target.value)}
          placeholder="0x..."
          disabled={isDeploying}
        />
      </div>

      <div className="form-group">
        <label>Owner Address (hex):</label>
        <input
          type="text"
          value={ownerAddress}
          onChange={(e) => setOwnerAddress(e.target.value)}
          placeholder="0x..."
          disabled={isDeploying}
        />
      </div>

      {deploymentError && (
        <div className="error">
          Error: {deploymentError}
          <button onClick={clearDeploymentError}>×</button>
        </div>
      )}

      {lastContractAddress && (
        <div className="success">
          Last deployed contract: {lastContractAddress}
        </div>
      )}

      <button onClick={handleDeploy} disabled={isDeploying || !ownerSecretKey || !ownerAddress}>
        {isDeploying ? 'Deploying...' : 'Deploy Contract'}
      </button>
    </div>
  );
};

// NFT Operations Component
const NFTOperationsPanel: React.FC = () => {
  const { mintNFT, getNFT, isLoading, error } = useMidnightForge();
  
  const [contractAddress, setContractAddress] = useState('');
  const [metadataHash, setMetadataHash] = useState('');
  const [did, setDid] = useState('');
  const [nftId, setNftId] = useState('');
  const [nftData, setNftData] = useState<any>(null);

  const handleMintNFT = async () => {
    if (!contractAddress || !metadataHash || !did) {
      alert('Please fill all fields');
      return;
    }

    try {
      const result = await mintNFT({
        contractAddress,
        metadataHash,
        did,
      });

      if (result.success) {
        alert(`NFT minted successfully!`);
      } else {
        alert(`Minting failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Minting error:', error);
    }
  };

  const handleGetNFT = async () => {
    if (!contractAddress || !nftId) {
      alert('Please provide contract address and NFT ID');
      return;
    }

    try {
      const result = await getNFT(contractAddress, parseInt(nftId));
      
      if (result.success) {
        setNftData(result.data?.nft);
      } else {
        alert(`Failed to get NFT: ${result.error}`);
      }
    } catch (error) {
      console.error('Get NFT error:', error);
    }
  };

  return (
    <div className="panel">
      <h2>NFT Operations</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mint NFT */}
        <div>
          <h3>Mint NFT</h3>
          <div className="form-group">
            <label>Contract Address:</label>
            <input
              type="text"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label>Metadata Hash:</label>
            <input
              type="text"
              value={metadataHash}
              onChange={(e) => setMetadataHash(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label>DID:</label>
            <input
              type="text"
              value={did}
              onChange={(e) => setDid(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <button onClick={handleMintNFT} disabled={isLoading}>
            {isLoading ? 'Minting...' : 'Mint NFT'}
          </button>
        </div>

        {/* Get NFT */}
        <div>
          <h3>Get NFT</h3>
          <div className="form-group">
            <label>Contract Address:</label>
            <input
              type="text"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label>NFT ID:</label>
            <input
              type="number"
              value={nftId}
              onChange={(e) => setNftId(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <button onClick={handleGetNFT} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Get NFT'}
          </button>

          {nftData && (
            <div className="nft-data">
              <h4>NFT Data:</h4>
              <pre>{JSON.stringify(nftData, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>

      {error && <div className="error">Error: {error}</div>}
    </div>
  );
};

// Batch Operations Component
const BatchOperationsPanel: React.FC = () => {
  const { deployAndMintBatch, isLoading, error } = useMidnightForge();
  
  const [batchConfig, setBatchConfig] = useState({
    ownerSecretKey: '',
    ownerAddress: '',
    nftCount: 3,
  });

  const handleBatchOperation = async () => {
    if (!batchConfig.ownerSecretKey || !batchConfig.ownerAddress) {
      alert('Please provide deployment configuration');
      return;
    }

    // Generate example NFT mint requests
    const mintRequests = Array.from({ length: batchConfig.nftCount }, (_, i) => ({
      metadataHash: `0x${'0'.repeat(62)}${(i + 1).toString(16)}`, // Example hash
      did: `0x${'1'.repeat(62)}${(i + 1).toString(16)}`, // Example DID
    }));

    try {
      const result = await deployAndMintBatch(
        {
          ownerSecretKey: batchConfig.ownerSecretKey,
          ownerAddress: batchConfig.ownerAddress,
        },
        mintRequests
      );

      console.log('Batch operation result:', result);
      
      if (result.deployResult.success) {
        const successfulMints = result.mintResults.filter(r => r.success).length;
        alert(`Batch operation completed!\nContract: ${result.deployResult.data?.contractAddress}\nSuccessful mints: ${successfulMints}/${result.mintResults.length}`);
      } else {
        alert(`Batch operation failed: ${result.deployResult.error}`);
      }
    } catch (error) {
      console.error('Batch operation error:', error);
    }
  };

  return (
    <div className="panel">
      <h2>Batch Operations</h2>
      <p>Deploy a contract and mint multiple NFTs in sequence</p>
      
      <div className="form-group">
        <label>Owner Secret Key:</label>
        <input
          type="text"
          value={batchConfig.ownerSecretKey}
          onChange={(e) => setBatchConfig(prev => ({ ...prev, ownerSecretKey: e.target.value }))}
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label>Owner Address:</label>
        <input
          type="text"
          value={batchConfig.ownerAddress}
          onChange={(e) => setBatchConfig(prev => ({ ...prev, ownerAddress: e.target.value }))}
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label>Number of NFTs to mint:</label>
        <input
          type="number"
          min="1"
          max="10"
          value={batchConfig.nftCount}
          onChange={(e) => setBatchConfig(prev => ({ ...prev, nftCount: parseInt(e.target.value) || 1 }))}
          disabled={isLoading}
        />
      </div>

      {error && <div className="error">Error: {error}</div>}

      <button onClick={handleBatchOperation} disabled={isLoading}>
        {isLoading ? 'Processing Batch...' : `Deploy & Mint ${batchConfig.nftCount} NFTs`}
      </button>
    </div>
  );
}; 