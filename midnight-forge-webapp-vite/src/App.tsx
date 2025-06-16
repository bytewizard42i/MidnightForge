import { useState } from 'react';
import './App.css';
import CreateMetadataForm from './components/CreateMetadataForm';
import WalletConnection from './components/WalletConnection';
import WorkflowNavigation from './components/WorkflowNavigation';
import DeployContract from './components/DeployContract';
import ViewNFTs from './components/ViewNFTs';

function App() {
  const [currentStep, setCurrentStep] = useState('deploy');
  const [contractDeployed, setContractDeployed] = useState(false);
  const [deployedContractAddress, setDeployedContractAddress] = useState<string>('');
  const [nftMinted, setNftMinted] = useState(false);

  const steps = [
    {
      id: 'deploy',
      title: 'Deploy Contract',
      description: 'Deploy your DIDz NFT smart contract to the Midnight blockchain',
      icon: '🚀',
      completed: contractDeployed,
      locked: false
    },
    {
      id: 'create-nft',
      title: 'Mint DIDz NFT',
      description: 'Mint your DIDz NFT to the Midnight blockchain',
      icon: '🎨',
      completed: nftMinted,
      locked: !contractDeployed
    },
    {
      id: 'view-nfts',
      title: 'View & Manage NFTs',
      description: 'Browse and manage your minted NFTs with mutability features',
      icon: '👁️',
      completed: false,
      locked: !contractDeployed
    }
  ];

  const handleStepChange = (stepId: string) => {
    // Only allow navigation to unlocked steps
    const step = steps.find(s => s.id === stepId);
    if (step && !step.locked) {
      setCurrentStep(stepId);
    }
  };

  const handleDeploySuccess = (contractAddress: string) => {
    setContractDeployed(true);
    setDeployedContractAddress(contractAddress);
    // Navigate immediately to next step after successful deployment
    setCurrentStep('create-nft');
  };

  const handleMintSuccess = () => {
    setNftMinted(true);
    // Auto-navigate to view NFTs after successful mint
    setCurrentStep('view-nfts');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'deploy':
        return <DeployContract onDeploySuccess={handleDeploySuccess} />;
      case 'create-nft':
        return <CreateMetadataForm 
          contractAddress={deployedContractAddress} 
          onMintSuccess={handleMintSuccess}
        />;
      case 'view-nfts':
        return <ViewNFTs contractAddress={deployedContractAddress} />;
      default:
        return <DeployContract onDeploySuccess={handleDeploySuccess} />;
    }
  };

  return (
    <div className="App">
      {/* Floating wallet status indicator */}
      <WalletConnection />
      
      {/* Main workflow content */}
      <WorkflowNavigation
        steps={steps}
        currentStep={currentStep}
        onStepChange={handleStepChange}
      >
        {renderStepContent()}
      </WorkflowNavigation>
    </div>
  );
}

export default App;
