// Simple test script for the deploy contract endpoint
const testDeploy = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/deploy-contract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ownerSecretKey: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        ownerAddress: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      })
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Test health endpoint first
const testHealth = async () => {
  try {
    const response = await fetch('http://localhost:3001/health');
    const result = await response.json();
    console.log('Health check:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Health check failed:', error);
  }
};

console.log('Testing health endpoint...');
testHealth().then(() => {
  console.log('\nTesting deploy contract endpoint...');
  testDeploy();
}); 