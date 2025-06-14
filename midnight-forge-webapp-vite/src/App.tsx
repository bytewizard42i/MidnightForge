import { useState } from 'react';
import './App.css';
import CreateMetadataForm from './components/CreateMetadataForm';
import WalletConnection from './components/WalletConnection';
import WorkflowNavigation from './components/WorkflowNavigation';
import DeployContract from './components/DeployContract';

function App() {
  const [currentStep, setCurrentStep] = useState('deploy');
  const [contractDeployed, setContractDeployed] = useState(false);

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
      title: 'Create NFT Metadata',
      description: 'Create and upload metadata for your NFT to IPFS',
      icon: '🎨',
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

  const handleDeploySuccess = () => {
    setContractDeployed(true);
    // Auto-navigate to next step after successful deployment
    setTimeout(() => {
      setCurrentStep('create-nft');
    }, 2000);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'deploy':
        return <DeployContract onDeploySuccess={handleDeploySuccess} />;
      case 'create-nft':
        return <CreateMetadataForm />;
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
