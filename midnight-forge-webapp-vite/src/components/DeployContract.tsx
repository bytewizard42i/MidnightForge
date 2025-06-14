import React, { useState } from 'react';
import styles from './DeployContract.module.css';

interface DeployContractProps {
  onDeploySuccess: () => void;
}

const DeployContract: React.FC<DeployContractProps> = ({ onDeploySuccess }) => {
  const [contractName, setContractName] = useState<string>('DIDz NFT Contract');
  const [contractSymbol, setContractSymbol] = useState<string>('DIDZ');
  const [maxSupply, setMaxSupply] = useState<string>('10000');
  const [deploymentStatus, setDeploymentStatus] = useState<string>('');
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [deployedAddress, setDeployedAddress] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleDeploy = async () => {
    console.log('Deploy button clicked!');
    
    if (!contractName.trim()) {
      setError('Contract name is required');
      return;
    }
    
    if (!contractSymbol.trim()) {
      setError('Contract symbol is required');
      return;
    }

    if (!maxSupply || parseInt(maxSupply) <= 0) {
      setError('Max supply must be a positive number');
      return;
    }

    console.log('Starting deployment...');
    setIsDeploying(true);
    setError('');
    setDeploymentStatus('Preparing contract deployment...');

    try {
      // Simulate deployment process
      await new Promise(resolve => setTimeout(resolve, 1000));
      setDeploymentStatus('Compiling smart contract...');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      setDeploymentStatus('Deploying to Midnight network...');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      setDeploymentStatus('Verifying deployment...');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate successful deployment
      const mockAddress = '0x' + Math.random().toString(16).substr(2, 40);
      setDeployedAddress(mockAddress);
      setDeploymentStatus(`✅ Contract deployed successfully!`);
      
      // Call success callback after a short delay
      setTimeout(() => {
        onDeploySuccess();
      }, 1500);
      
    } catch (err: any) {
      setError('Deployment failed: ' + err.message);
      setDeploymentStatus('❌ Deployment failed');
    } finally {
      setIsDeploying(false);
    }
  };

  const resetForm = () => {
    setContractName('DIDz NFT Contract');
    setContractSymbol('DIDZ');
    setMaxSupply('10000');
    setDeploymentStatus('');
    setDeployedAddress('');
    setError('');
  };

  return (
    <div className={styles.deployContainer}>
      <div className={styles.deployHeader}>
        <h2>Deploy Your DIDz NFT Contract</h2>
        <p>Configure and deploy your smart contract to the Midnight blockchain</p>
      </div>

      {!deployedAddress ? (
        <form onSubmit={(e) => { e.preventDefault(); handleDeploy(); }} className={styles.deployForm}>
          <div className={styles.formGroup}>
            <label htmlFor="contractName">Contract Name</label>
            <input
              id="contractName"
              type="text"
              value={contractName}
              onChange={(e) => setContractName(e.target.value)}
              placeholder="Enter contract name"
              disabled={isDeploying}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="contractSymbol">Contract Symbol</label>
            <input
              id="contractSymbol"
              type="text"
              value={contractSymbol}
              onChange={(e) => setContractSymbol(e.target.value)}
              placeholder="Enter contract symbol (e.g., DIDZ)"
              disabled={isDeploying}
              className={styles.input}
              maxLength={10}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="maxSupply">Max Supply</label>
            <input
              id="maxSupply"
              type="number"
              value={maxSupply}
              onChange={(e) => setMaxSupply(e.target.value)}
              placeholder="Enter maximum supply"
              disabled={isDeploying}
              className={styles.input}
              min="1"
            />
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleDeploy}
            disabled={isDeploying}
            className={`${styles.deployButton} ${isDeploying ? styles.deploying : ''}`}
          >
            {isDeploying ? (
              <>
                <div className={styles.spinner}></div>
                Deploying...
              </>
            ) : (
              '🚀 Deploy Contract'
            )}
          </button>

          {deploymentStatus && (
            <div className={styles.statusMessage}>
              {deploymentStatus}
            </div>
          )}
        </form>
      ) : (
        <div className={styles.successContainer}>
          <div className={styles.successIcon}>🎉</div>
          <h3>Contract Deployed Successfully!</h3>
          <div className={styles.contractDetails}>
            <div className={styles.detailItem}>
              <strong>Contract Name:</strong> {contractName}
            </div>
            <div className={styles.detailItem}>
              <strong>Symbol:</strong> {contractSymbol}
            </div>
            <div className={styles.detailItem}>
              <strong>Max Supply:</strong> {maxSupply}
            </div>
            <div className={styles.detailItem}>
              <strong>Contract Address:</strong>
              <code className={styles.address}>{deployedAddress}</code>
            </div>
          </div>
          <p className={styles.nextStepMessage}>
            🎯 Great! Now you can proceed to create NFT metadata
          </p>
          <button 
            onClick={resetForm}
            className={styles.resetButton}
          >
            Deploy Another Contract
          </button>
        </div>
      )}
    </div>
  );
};

export default DeployContract; 