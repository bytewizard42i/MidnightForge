# 🔐 Secrets Management with SOPS + age

This project uses **SOPS (Secrets OPerationS)** with **age** encryption to securely manage environment variables and secrets. This allows us to:

- ✅ Store encrypted secrets in version control (GitHub)
- ✅ Share secrets securely with team members
- ✅ Keep sensitive data like API keys and wallet seeds safe
- ✅ Maintain different configurations for development/production

## 📁 File Structure

```
MidnightForge/
├── .env.example          # 📝 Template file (safe to commit)
├── .env.secrets          # 🔐 Unencrypted secrets (DO NOT COMMIT)
├── .env.secrets.enc      # 🔒 Encrypted secrets (safe to commit)
├── .sops.yaml           # ⚙️  SOPS configuration
├── key.txt              # 🔑 Encryption key (DO NOT COMMIT)
├── setup-secrets.sh     # 🚀 Helper script
└── load-env.js          # 📦 Environment loader
```

## 🚀 Quick Start

### For New Developers (First Time Setup)

1. **Install dependencies** (if not already installed):
   ```bash
   brew install sops age  # macOS
   # or
   sudo apt install sops age  # Ubuntu
   ```

2. **Get the encryption key** from a team member and save it as `key.txt` in the project root

3. **Setup secrets**:
   ```bash
   npm run secrets:setup
   ```

4. **Start developing** - the secrets are now available to your applications!

### For Existing Team Members

If you already have the setup and just need to get the latest secrets:

```bash
npm run secrets:decrypt
```

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `npm run secrets:setup` | Initial setup for new developers |
| `npm run secrets:encrypt` | Encrypt secrets after editing |
| `npm run secrets:decrypt` | Decrypt latest secrets |
| `npm run secrets:edit` | Edit encrypted secrets directly |
| `npm run secrets:help` | Show help information |

## 📝 Environment Variables

### Server Variables
- `WALLET_SEED` - Wallet seed for server operations
- `PORT` - Server port (default: 3001)
- `MIDNIGHT_NETWORK` - Network type (`local` or `testnet`)
- `MIDNIGHT_INDEXER_URL` - Indexer GraphQL endpoint
- `MIDNIGHT_NODE_URL` - Blockchain node endpoint
- `LOG_LEVEL` - Logging level

### Frontend Variables (VITE_ prefixed)
- `VITE_PINATA_API_KEY` - Pinata IPFS API key
- `VITE_PINATA_SECRET_API_KEY` - Pinata IPFS secret key
- `VITE_NETWORK_ID` - Network ID for frontend
- `VITE_LOGGING_LEVEL` - Frontend logging level

### Development Variables
- `SYNC_CACHE` - Cache directory for wallet sync
- `DEBUG_LEVEL` - Debug level for CLI tools
- `TEST_*` - Various test configuration variables

## 🔄 Workflow

### Adding New Secrets

1. **Edit the secrets file**:
   ```bash
   npm run secrets:edit
   # or manually edit .env.secrets (after decrypting)
   ```

2. **Encrypt the updated secrets**:
   ```bash
   npm run secrets:encrypt
   ```

3. **Commit the encrypted file**:
   ```bash
   git add .env.secrets.enc
   git commit -m "Update secrets"
   ```

### Getting Latest Secrets

When someone else updates secrets:

```bash
git pull
npm run secrets:decrypt
```

## 🏗️ How It Works

### Encryption Process
1. Edit `.env.secrets` with real values
2. SOPS encrypts it using the `age` public key
3. Creates `.env.secrets.enc` (encrypted, safe to commit)
4. Original `.env.secrets` stays local (gitignored)

### Decryption Process
1. SOPS reads `.env.secrets.enc` from git
2. Uses your local `key.txt` (private key) to decrypt
3. Creates `.env.secrets` locally for your apps to use

### Application Loading
- Server: Loads all variables except `VITE_*` prefixed ones
- Webapp: Loads only `VITE_*` prefixed variables
- Uses `load-env.js` utility for consistent loading

## 🔧 Integration with Applications

### Server Integration

The server automatically loads environment variables. You can also manually load them:

```javascript
import { loadEnvironment } from '../load-env.js';

// Load server-specific variables
loadEnvironment('server');

// Now use process.env.WALLET_SEED, etc.
```

### Webapp Integration

For Vite applications, the `VITE_*` variables are automatically available:

```javascript
// In your React components
const apiKey = import.meta.env.VITE_PINATA_API_KEY;
const networkId = import.meta.env.VITE_NETWORK_ID;
```

## 🔒 Security Best Practices

### ✅ DO
- Commit `.env.secrets.enc` (encrypted file)
- Commit `.env.example` (template file)
- Share `key.txt` securely with team members
- Use strong, unique values for production
- Regularly rotate sensitive credentials

### ❌ DON'T
- Commit `.env.secrets` (unencrypted file)
- Commit `key.txt` (encryption key)
- Share secrets in plain text (Slack, email, etc.)
- Use the same secrets for dev/staging/production
- Leave default/example values in production

## 🚨 Troubleshooting

### "Secrets file not found"
```bash
# Make sure you've decrypted the secrets
npm run secrets:decrypt

# Or run initial setup
npm run secrets:setup
```

### "Encryption key not found"
```bash
# Get the key.txt file from a team member
# Place it in the project root directory
```

### "SOPS/age not installed"
```bash
# macOS
brew install sops age

# Ubuntu/Debian
sudo apt install sops age

# Or download from GitHub releases
```

### "Permission denied on setup-secrets.sh"
```bash
chmod +x setup-secrets.sh
```

## 🔄 Migration from Plain .env

If you're migrating from plain `.env` files:

1. **Backup your current `.env` files**
2. **Copy values to `.env.secrets`**:
   ```bash
   cp .env .env.secrets
   ```
3. **Encrypt the secrets**:
   ```bash
   npm run secrets:encrypt
   ```
4. **Remove old `.env` files** and commit the encrypted version

## 🤝 Team Collaboration

### For Project Maintainers

When adding new team members:

1. Share the `key.txt` file securely (encrypted email, secure file sharing)
2. Have them run `npm run secrets:setup`
3. Verify they can decrypt and access the secrets

### For Team Members

When you get access:

1. Save the `key.txt` file in the project root
2. Run `npm run secrets:setup`
3. Never commit the `key.txt` or `.env.secrets` files

## 📚 Additional Resources

- [SOPS Documentation](https://github.com/getsops/sops)
- [age Encryption Tool](https://github.com/FiloSottile/age)
- [Environment Variables Best Practices](https://12factor.net/config)

---

**Need help?** Run `npm run secrets:help` or check the troubleshooting section above. 