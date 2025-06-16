# 🔐 Using Encrypted Secrets in Your Code

This guide shows practical examples of how to use the encrypted environment variables in different parts of your MidnightForge application.

## 🖥️ Server-Side Usage (Node.js)

### Basic Environment Variable Access

```typescript
// In any server file (after config.ts is imported)
const walletSeed = process.env.WALLET_SEED;
const port = process.env.PORT || '3001';
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

console.log('Server starting on port:', port);
```

### Configuration Example

```typescript
// midnight-forge-server/src/config.ts
export const getServerConfig = (): ServerConfig => {
  return {
    port: parseInt(process.env.PORT || '3001', 10),
    walletSeed: process.env.WALLET_SEED || '',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    midnight: {
      indexer: process.env.MIDNIGHT_INDEXER_URL || 'http://127.0.0.1:8088/api/v1/graphql',
      node: process.env.MIDNIGHT_NODE_URL || 'http://127.0.0.1:9944',
      // ... other config
    }
  };
};
```

### API Route Example

```typescript
// midnight-forge-server/src/routes/deploy.ts
import { getServerConfig } from '../config.js';

export async function deployContract(req: Request, res: Response) {
  const config = getServerConfig();
  
  // Use the wallet seed from encrypted secrets
  const wallet = buildWallet(config.walletSeed);
  
  // Use network configuration from secrets
  const indexer = config.midnight.indexer;
  
  // Deploy contract logic...
}
```

## 🌐 Frontend Usage (React/Vite)

### Component Example

```tsx
// midnight-forge-webapp-vite/src/components/PinataUpload.tsx
import React from 'react';

export const PinataUpload: React.FC = () => {
  // These are automatically loaded from encrypted secrets
  const apiKey = import.meta.env.VITE_PINATA_API_KEY;
  const secretKey = import.meta.env.VITE_PINATA_SECRET_API_KEY;
  
  const uploadToIPFS = async (file: File) => {
    if (!apiKey || !secretKey) {
      throw new Error('Pinata API keys not configured');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': apiKey,
        'pinata_secret_api_key': secretKey,
      },
      body: formData,
    });
    
    return response.json();
  };
  
  return (
    <div>
      <input type="file" onChange={(e) => {
        if (e.target.files?.[0]) {
          uploadToIPFS(e.target.files[0]);
        }
      }} />
    </div>
  );
};
```

### Service Example

```typescript
// midnight-forge-webapp-vite/src/services/PinataService.ts
class PinataService {
  private apiKey: string;
  private secretKey: string;
  
  constructor() {
    this.apiKey = import.meta.env.VITE_PINATA_API_KEY;
    this.secretKey = import.meta.env.VITE_PINATA_SECRET_API_KEY;
    
    if (!this.apiKey || !this.secretKey) {
      console.warn('Pinata API keys not configured');
    }
  }
  
  async uploadJSON(data: object): Promise<string> {
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': this.apiKey,
        'pinata_secret_api_key': this.secretKey,
      },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    return result.IpfsHash;
  }
}

export const pinataService = new PinataService();
```

### Configuration Hook

```tsx
// midnight-forge-webapp-vite/src/hooks/useConfig.ts
import { useMemo } from 'react';

export const useConfig = () => {
  return useMemo(() => ({
    networkId: import.meta.env.VITE_NETWORK_ID,
    loggingLevel: import.meta.env.VITE_LOGGING_LEVEL,
    pinata: {
      apiKey: import.meta.env.VITE_PINATA_API_KEY,
      secretKey: import.meta.env.VITE_PINATA_SECRET_API_KEY,
      isConfigured: !!(import.meta.env.VITE_PINATA_API_KEY && import.meta.env.VITE_PINATA_SECRET_API_KEY),
    },
  }), []);
};

// Usage in component
export const MyComponent: React.FC = () => {
  const config = useConfig();
  
  if (!config.pinata.isConfigured) {
    return <div>Please configure Pinata API keys</div>;
  }
  
  return <div>Network: {config.networkId}</div>;
};
```

## 🧪 Testing with Secrets

### Test Configuration

```typescript
// tests/setup.ts
import { loadEnvironment } from '../load-env.js';

// Load test environment variables
loadEnvironment('all');

// Override for testing
process.env.MIDNIGHT_NETWORK = 'local';
process.env.WALLET_SEED = '0000000000000000000000000000000000000000000000000000000000000001';
```

### Test Example

```typescript
// tests/deploy.test.ts
describe('Contract Deployment', () => {
  beforeAll(() => {
    // Ensure test environment is loaded
    expect(process.env.WALLET_SEED).toBeDefined();
    expect(process.env.MIDNIGHT_INDEXER_URL).toBeDefined();
  });
  
  it('should deploy contract with correct configuration', async () => {
    const config = getServerConfig();
    expect(config.walletSeed).toBe(process.env.WALLET_SEED);
    expect(config.midnight.indexer).toBe(process.env.MIDNIGHT_INDEXER_URL);
  });
});
```

## 🔄 Environment-Specific Usage

### Development vs Production

```typescript
// Check environment and use appropriate values
const isDevelopment = process.env.NODE_ENV === 'development';
const isLocal = process.env.MIDNIGHT_NETWORK === 'local';

if (isDevelopment && isLocal) {
  // Use local blockchain
  const indexer = process.env.MIDNIGHT_INDEXER_URL; // http://127.0.0.1:8088/...
  const walletSeed = process.env.WALLET_SEED; // Genesis seed for local dev
} else {
  // Use TestNet
  const indexer = process.env.MIDNIGHT_INDEXER_URL; // https://indexer.testnet-02...
  const walletSeed = process.env.WALLET_SEED; // Your actual wallet seed
}
```

### Conditional Features

```tsx
// Enable features based on configuration
export const FeatureFlags: React.FC = () => {
  const hasPinata = !!(import.meta.env.VITE_PINATA_API_KEY && import.meta.env.VITE_PINATA_SECRET_API_KEY);
  const isTestNet = import.meta.env.VITE_NETWORK_ID === 'TestNet';
  
  return (
    <div>
      {hasPinata && <IPFSUploadComponent />}
      {isTestNet && <TestNetWarning />}
    </div>
  );
};
```

## 🚨 Error Handling

### Graceful Fallbacks

```typescript
// Server-side error handling
export const getWalletSeed = (): string => {
  const seed = process.env.WALLET_SEED;
  
  if (!seed) {
    if (process.env.MIDNIGHT_NETWORK === 'local') {
      console.warn('Using genesis seed for local development');
      return '0000000000000000000000000000000000000000000000000000000000000001';
    } else {
      throw new Error('WALLET_SEED is required for non-local environments');
    }
  }
  
  return seed;
};
```

### Frontend Error Handling

```tsx
// Component with error boundaries
export const SecureComponent: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const apiKey = import.meta.env.VITE_PINATA_API_KEY;
    
    if (!apiKey) {
      setError('API configuration missing. Please run: npm run secrets:setup');
    }
  }, []);
  
  if (error) {
    return <div className="error">⚠️ {error}</div>;
  }
  
  return <div>Component content...</div>;
};
```

## 📝 Best Practices

### 1. **Always Check for Required Variables**

```typescript
const requiredEnvVars = ['WALLET_SEED', 'MIDNIGHT_INDEXER_URL'];
const missing = requiredEnvVars.filter(key => !process.env[key]);

if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}
```

### 2. **Use Type-Safe Configuration**

```typescript
interface AppConfig {
  walletSeed: string;
  network: 'local' | 'testnet';
  indexer: string;
  pinata?: {
    apiKey: string;
    secretKey: string;
  };
}

export const getConfig = (): AppConfig => {
  const config: AppConfig = {
    walletSeed: process.env.WALLET_SEED!,
    network: process.env.MIDNIGHT_NETWORK as 'local' | 'testnet',
    indexer: process.env.MIDNIGHT_INDEXER_URL!,
  };
  
  if (process.env.VITE_PINATA_API_KEY && process.env.VITE_PINATA_SECRET_API_KEY) {
    config.pinata = {
      apiKey: process.env.VITE_PINATA_API_KEY,
      secretKey: process.env.VITE_PINATA_SECRET_API_KEY,
    };
  }
  
  return config;
};
```

### 3. **Environment Validation**

```typescript
// Validate environment on startup
export const validateEnvironment = () => {
  const errors: string[] = [];
  
  if (!process.env.WALLET_SEED) {
    errors.push('WALLET_SEED is required');
  }
  
  if (process.env.MIDNIGHT_NETWORK === 'testnet' && !process.env.WALLET_SEED?.startsWith('0000')) {
    errors.push('TestNet requires a proper wallet seed (not genesis seed)');
  }
  
  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }
};
```

## 🔄 Development Workflow

1. **Edit secrets**: `npm run secrets:edit`
2. **Test locally**: Your app automatically uses the decrypted values
3. **Encrypt changes**: `npm run secrets:encrypt`
4. **Commit encrypted file**: `git add .env.secrets.enc && git commit -m "Update secrets"`
5. **Team members sync**: `git pull && npm run secrets:decrypt`

---

**Remember**: The encrypted secrets are automatically loaded when your applications start, so you can use `process.env.VARIABLE_NAME` (server) or `import.meta.env.VITE_VARIABLE_NAME` (frontend) just like normal environment variables! 