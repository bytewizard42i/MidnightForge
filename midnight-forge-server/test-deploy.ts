/**
 * Integration test script for the deploy contract endpoint
 * Usage: tsx test-deploy.ts
 */

interface DeployContractRequest {
  ownerSecretKey: string;
  ownerAddress: string;
}

interface HealthResponse {
  status: string;
  timestamp?: string;
  [key: string]: unknown;
}

interface DeployContractResponse {
  success?: boolean;
  contractAddress?: string;
  transactionId?: string;
  error?: string;
  message?: string;
  [key: string]: unknown;
}

interface TestResult {
  success: boolean;
  status: number;
  data: unknown;
  error?: string;
}

const BASE_URL = 'http://localhost:3001';

/**
 * Test the health endpoint to ensure server is running
 */
const testHealth = async (): Promise<boolean> => {
  try {
    console.log('🔍 Testing health endpoint...');
    const response = await fetch(`${BASE_URL}/health`);
    const result: HealthResponse = await response.json();
    
    // console.log('✅ Health check result:', JSON.stringify(result, null, 2));
    return response.ok;
  } catch (error) {
    console.error('❌ Health check failed:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
};

/**
 * Test the deploy contract endpoint
 */
const testDeploy = async (): Promise<TestResult> => {
  try {
    console.log('🚀 Testing deploy contract endpoint...');
    
    const requestBody: DeployContractRequest = {
      ownerSecretKey: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      ownerAddress: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    };

    const response = await fetch(`${BASE_URL}/api/deploy-contract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const result: DeployContractResponse = await response.json();
    
    console.log('📊 Response status:', response.status);
    console.log('📋 Response body:', JSON.stringify(result, null, 2));
    
    return {
      success: response.ok,
      status: response.status,
      data: result
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Deploy test failed:', errorMessage);
    
    return {
      success: false,
      status: 0,
      data: null,
      error: errorMessage
    };
  }
};

/**
 * Run all tests in sequence
 */
const runTests = async (): Promise<void> => {
  console.log('🧪 Running integration tests for Midnight Forge Server...\n');
  
  // Test health endpoint first
  const healthOk = await testHealth();
  
  if (!healthOk) {
    console.error('\n❌ Health check failed, skipping deploy test');
    console.log('💡 Make sure the server is running on http://localhost:3001');
    process.exit(1);
  }

  console.log('');
  
  // Test deploy endpoint
  const deployResult = await testDeploy();
  
  // Print results
  console.log('\n📊 Test Results:');
  if (deployResult.success) {
    console.log('✅ Deploy test PASSED');
  } else {
    console.log('❌ Deploy test FAILED');
    if (deployResult.error) {
      console.log('Error:', deployResult.error);
    }
  }
  
  console.log('\n🏁 Test execution completed');
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Test execution failed:', errorMessage);
    process.exit(1);
  });
}

// Export functions for potential reuse
export { testHealth, testDeploy, runTests };
export type { DeployContractRequest, HealthResponse, DeployContractResponse, TestResult }; 