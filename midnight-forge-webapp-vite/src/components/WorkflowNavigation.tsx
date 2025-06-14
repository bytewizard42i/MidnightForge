import React, { useState } from 'react';
import styles from './WorkflowNavigation.module.css';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
  locked: boolean;
}

interface WorkflowNavigationProps {
  steps: WorkflowStep[];
  currentStep: string;
  onStepChange: (stepId: string) => void;
  children: React.ReactNode;
}

const WorkflowNavigation: React.FC<WorkflowNavigationProps> = ({ 
  steps, 
  currentStep, 
  onStepChange, 
  children 
}) => {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  
  return (
    <div className={styles.workflowContainer}>
      <div className={styles.workflowHeader}>
        <h1 className={styles.workflowTitle}>DIDz NFT Creation Workflow</h1>
        <p className={styles.workflowSubtitle}>Follow these steps to deploy your contract and create NFTs</p>
      </div>
      
      <div className={styles.stepperContainer}>
        <div className={styles.stepper}>
          {steps.map((step, index) => (
            <div key={step.id} className={styles.stepWrapper}>
              <div 
                className={`${styles.step} ${
                  step.id === currentStep ? styles.active : ''
                } ${step.completed ? styles.completed : ''} ${
                  step.locked ? styles.locked : ''
                }`}
                onClick={() => !step.locked && onStepChange(step.id)}
              >
                <div className={styles.stepIcon}>
                  {step.completed ? '✓' : step.icon}
                </div>
                <div className={styles.stepInfo}>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDescription}>{step.description}</p>
                </div>
                {step.locked && (
                  <div className={styles.lockIcon}>🔒</div>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`${styles.stepConnector} ${
                  step.completed ? styles.connectorCompleted : ''
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className={styles.mainContent}>
        {children}
      </div>
      
      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill}
          style={{ 
            width: `${((currentStepIndex + 1) / steps.length) * 100}%` 
          }}
        />
      </div>
    </div>
  );
};

export default WorkflowNavigation; 