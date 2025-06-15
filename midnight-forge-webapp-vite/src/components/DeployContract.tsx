import React, { useState } from 'react';
import styles from './DeployContract.module.css';
import { useMidnightForgeDeployment } from '../hooks/useMidnightForge';
import DeploymentModal from './DeploymentModal';

interface DeployContractProps {
  onDeploySuccess: (contractAddress: string) => void;
}

const DeployContract: React.FC<DeployContractProps> = ({ onDeploySuccess }) => {
  // Form state - back to original fields
  const [contractName, setContractName] = useState<string>('DIDz NFT Contract');
  const [contractSymbol, setContractSymbol] = useState<string>('DIDZ');
  const [maxSupply, setMaxSupply] = useState<string>('10000');
  
  // API integration
  const { 
    deployContract, 
    lastDeployment, 
    isDeploying, 
    deploymentError, 
    clearDeploymentError,
    lastContractAddress 
  } = useMidnightForgeDeployment();

  // Local state
  const [deploymentStatus, setDeploymentStatus] = useState<string>('');
  const [deployedContractAddress, setDeployedContractAddress] = useState<string>('');

  const handleDeploy = async () => {
    console.log('Deploy button clicked!');
    
    if (!contractName.trim()) {
      return;
    }
    
    if (!contractSymbol.trim()) {
      return;
    }

    if (!maxSupply || parseInt(maxSupply) <= 0) {
      return;
    }

    console.log('Starting real deployment...');
    clearDeploymentError();
    setDeploymentStatus('Connecting to Midnight Forge Server...');

    try {
      setDeploymentStatus('Preparing contract deployment...');
      
      // Use hardcoded genesis values for the API call
      const result = await deployContract({
        ownerSecretKey: '0000000000000000000000000000000000000000000000000000000000000001',
        ownerAddress: '0000000000000000000000000000000000000000000000000000000000000001',
      });

      if (result.success && result.data?.contractAddress) {
        setDeploymentStatus(`✅ Contract deployed successfully!`);
        setDeployedContractAddress(result.data.contractAddress);
        // Don't auto-navigate - let user choose when to proceed
      } else {
        setDeploymentStatus(`❌ Deployment failed: ${result.error || 'Unknown error'}`);
      }
      
    } catch (err: any) {
      console.error('Deployment error:', err);
      setDeploymentStatus(`❌ Deployment failed: ${err.message}`);
    }
  };

  const resetForm = () => {
    setContractName('DIDz NFT Contract');
    setContractSymbol('DIDZ');
    setMaxSupply('10000');
    setDeploymentStatus('');
    setDeployedContractAddress('');
    clearDeploymentError();
  };

  const handleProceedToNextStep = () => {
    if (deployedContractAddress) {
      onDeploySuccess(deployedContractAddress);
    }
  };

  const isFormValid = contractName.trim() && contractSymbol.trim() && maxSupply && parseInt(maxSupply) > 0;

  return (
    <div className={styles.deployContainer}>
      <div className={styles.deployHeader}>
        <h2>Deploy Your DIDz NFT Contract</h2>
        <p>Configure and deploy your smart contract to the Midnight blockchain</p>
      </div>

      {!lastContractAddress && !deployedContractAddress ? (
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

          {/* Error Display */}
          {deploymentError && (
            <div className={styles.errorMessage}>
              {deploymentError}
            </div>
          )}

          {/* Deploy Button */}
          <button
            type="button"
            onClick={handleDeploy}
            disabled={isDeploying || !isFormValid}
            className={`${styles.deployButton} ${isDeploying ? styles.deploying : ''}`}
          >
            {isDeploying ? (
              <>
                <div className={styles.spinner}></div>
                Deploying to Midnight...
              </>
            ) : (
              '🚀 Deploy Contract'
            )}
          </button>


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
              <code className={styles.address}>{deployedContractAddress || lastContractAddress}</code>
            </div>
            {lastDeployment?.data && (
              <div className={styles.detailItem}>
                <strong>Deployment Message:</strong> {lastDeployment.data.message}
              </div>
            )}
          </div>
          <p className={styles.nextStepMessage}>
            🎯 Great! Now you can proceed to create NFT metadata
          </p>
          <div className={styles.actionButtons}>
            <button 
              onClick={handleProceedToNextStep}
              className={styles.proceedButton}
            >
              ➡️ Continue to NFT Creation
            </button>
            <button 
              onClick={resetForm}
              className={styles.resetButton}
            >
              🔄 Deploy Another Contract
            </button>
          </div>
        </div>
      )}
      
      {/* Deployment Modal */}
      <DeploymentModal 
        isOpen={isDeploying} 
        deploymentStatus={deploymentStatus || 'Preparing deployment...'} 
      />
    </div>
  );
};

export default DeployContract; 