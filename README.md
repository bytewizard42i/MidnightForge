# 🌙 MidnightForge

[![Build Status](https://img.shields.io/github/actions/workflow/status/bytewizard42i/MidnightForge/ci.yml?branch=main)](https://github.com/bytewizard42i/MidnightForge/actions) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) [![Version](https://img.shields.io/github/v/release/bytewizard42i/MidnightForge)](https://github.com/bytewizard42i/MidnightForge/releases)

---

## 📖 Table of Contents
1. [✨ Overview](#-overview)
2. [🚀 Quick Start](#-quick-start)
3. [🛠️ Prerequisites](#️-prerequisites)
4. [📦 Installation](#-installation)
5. [🔐 Secrets Setup](#-secrets-setup)
6. [⚡ Running the Application](#-running-the-application)
7. [🌟 Goals](#-goals)
8. [🚀 Key Features](#-key-features)
9. [📂 Repository Structure](#-repository-structure)
10. [⚡ Build & Compile](#-build--compile)
11. [🚀 Deployment](#-deployment)
12. [💡 Automated DID Workflow](#-automated-did-workflow)
13. [🔍 AI-Powered Collaboration](#-ai-powered-collaboration)
14. [💻 Usage Example](#-usage-example)
15. [🧪 Testing](#-testing)
16. [📚 Examples](#-examples)
17. [🔧 Troubleshooting](#-troubleshooting)
18. [📝 Next Steps](#-next-steps)
19. [🤝 Contributing](#-contributing)
20. [📜 License](#-license)
21. [🙏 Acknowledgements](#-acknowledgements)

---

## ✨ Overview
**MidnightForge** is a modular, protocol-level wallet system on Cardano's Midnight selective-privacy blockchain. It enables:

- 🔒 **Privacy-Preserving DID NFTs** for verifiable credentials
- 📂 **Protocol level wallets with Folder-Based Smart Contracts** with pluggable logic per folder
- 🤖 **Automated GitHub Bots** and **AI Engines** for education, collaboration, and compensation
- ⚙️ **Seamless Integration** with Midnight Lace, CLI tools, and front-end SDKs

From **learning** to **earning**, MidnightForge orchestrates DID authorization, proof-of-participation, reputation, and micro-payments through an end-to-end workflow.

---

## 🚀 Quick Start

Get MidnightForge running in 3 steps:

```bash
# 1. Clone and install
git clone https://github.com/bytewizard42i/MidnightForge.git
cd MidnightForge
npm install

# 2. Setup secrets (get key.txt from team member first)
npm run secrets:setup

# 3. Start everything
npm run quickstart
```

**That's it!** 🎉 Your application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

---

## 🛠️ Prerequisites

### Required Software
- **Node.js** ≥ v22.15 ([Download](https://nodejs.org/))
- **Docker** & **Docker Compose** ([Download](https://docs.docker.com/get-docker/))

### Required Tools (for secrets management)
- **SOPS** & **age** for encrypted environment variables

```bash
# macOS
brew install sops age

# Ubuntu/Debian
sudo apt install sops age
```

### Compact Compiler
The **Compact compiler** is automatically downloaded and configured during the quickstart process. No manual setup required!

If you need to manage the compiler manually:
```bash
npm run compact:install    # Download and install compiler
npm run compact:check      # Check installation status
npm run compact:unset      # Unset for testing purposes
```

---

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/bytewizard42i/MidnightForge.git
cd MidnightForge

# Install all dependencies
npm install
```

---

## 🔐 Secrets Setup

MidnightForge uses encrypted environment variables for security.

### For New Developers

1. **Get the encryption key** from a team member and save it as `key.txt` in the project root
2. **Run the setup**:
   ```bash
   npm run secrets:setup
   ```

### For Existing Team Members

```bash
# Get latest secrets
npm run secrets:decrypt
```

### Available Commands

```bash
npm run secrets:setup     # Initial setup for new developers
npm run secrets:encrypt   # Encrypt secrets after editing
npm run secrets:decrypt   # Decrypt latest secrets
npm run secrets:edit      # Edit encrypted secrets directly
```

> **📚 For detailed secrets management:** See [SECRETS.md](./SECRETS.md)

---

## ⚡ Running the Application

### Full Stack (Recommended)

```bash
# Start blockchain + backend + frontend
npm run quickstart
```

This starts:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Blockchain Infrastructure**: Indexer (8088), Node (9944), Proof Server (6300)

### Development Mode

```bash
# Start applications only (requires blockchain running separately)
npm run apps:dev

# Start blockchain infrastructure only
npm run blockchain:start
```

### Individual Components

```bash
# Backend server
npm run server:dev

# Frontend webapp
npm run webapp:dev

# Blockchain services
npm run blockchain:start
```

### Stopping Services

```bash
# Stop applications (blockchain keeps running)
Ctrl+C

# Stop blockchain infrastructure
npm run blockchain:stop
```

> **📚 For detailed standalone setup:** See [STANDALONE.md](./STANDALONE.md)

---

## 🌟 Goals
| 🎓 Education       | 🤝 Collaboration             | 💰 Compensation                |
|--------------------|------------------------------|--------------------------------|
| Guided tutorials   | Auto-assign issues via bots  | On-chain micro-payments        |
| Credential tests   | Reputation-based workflows   | Escrow & milestone payouts     |
| Skill endorsements | Redundant tooling detection  | GitHub bounties integration    |

1. **Education**: Onboard contributors with automated DID-backed assessments.
2. **Collaboration**: Match skills & reputation to issues via AI bots.
3. **Compensation**: Release payments through semi-decentralized, transparent smart contracts.

---

## 🚀 Key Features
| Layer                            | Functionality                                                                   |
|----------------------------------|---------------------------------------------------------------------------------|
| **01_protocol_wallet_base**      | Core on-chain primitives: ownerKey, globalCounter                                |
| **02_protocol_wallet**           | Folder registry, create/archive, status, basic read API                         |
| **02_protocol_wallet/folder**    | Per-folder permissions: grant, revoke, query                                     |
| **02_protocol_wallet/issuer**    | Trusted issuer registry: add, revoke, verify                                     |
| **03_privacy_did_nft**           | ZK-powered DID NFTs: mint, owner, metadata                                       |
| **CLI (`counter-cli/`)**         | Command-line interaction with your protocols                                    |
| **Bots (`bots/`)**               | GitHub Assigner & Verifier for automated workflows                              |
| **AI Engine (`ai-engine/`)**     | Intent detection, redundancy checks, collaboration recommendations               |
| **SDK (`contract/src/index.ts`)**| TypeScript bindings for all contracts                                           |

---

## 📂 Repository Structure
```text
MidnightForge/
├── contract/                # Smart-contract code & SDK
│   ├── src/contracts/       # Compact contracts
│   └── src/managed/         # Generated files (ignored by git)
├── midnight-forge-server/   # Backend API server
├── midnight-forge-webapp-vite/ # Frontend React application
├── counter-cli/             # CLI for contract interaction
├── .sops.yaml              # Secrets encryption config (safe to commit)
├── setup-secrets.sh        # Secrets management script
└── start-standalone.sh     # Quick start script
```

---

## ⚡ Build & Compile

```bash
# Build everything
npm run build:all

# Build individual components
npm run contract:build    # Compile smart contracts
npm run server:build      # Build backend server
npm run webapp:build      # Build frontend webapp
```

> **📚 For contract development:** See [COMPILER_SETUP.md](./COMPILER_SETUP.md) and [DEVELOPMENT.md](./DEVELOPMENT.md)

---

## 🚀 Deployment

```bash
# Deploy using Docker Compose
npm run standalone

# Deploy in detached mode
npm run standalone:detached
```

---

## 💡 Automated DID Workflow
1. **Onboard**: User registers DID via GitHub OAuth.
2. **Assess**: Bot issues learning quests; mints DID NFT upon completion.
3. **Collaborate**: AI engine assigns issues to qualified users.
4. **Verify**: Verifier bot checks DID proofs on PRs and updates reputation.
5. **Compensate**: Smart contracts release escrowed payments to contributor's DID wallet.

---

## 🔍 AI-Powered Collaboration
- **Intent Gleaning**: AI scans repo activity and labels tasks by skill.
- **Redundancy Detection**: Flags duplicate tooling efforts.
- **Incentive Matching**: Suggests collaborators and sets micro-bounties.

---

## 💻 Usage Example
```ts
import { ProtocolWallet, DIDzNFT } from "./contract/src/index";
import { GitHubAssignerBot } from "./bots/assigner";

async function demo() {
  const wallet = new ProtocolWallet(signer);
  const folderId = await wallet.createFolder("Tutorials", ownerSig);

  const nft = new DIDzNFT(signer);
  const credId = await nft.mintCredential(userDid, metadata, type, issuerSig);

  const bot = new GitHubAssignerBot(wallet, "org/MidnightForge");
  bot.start();
}
```

---

## 🧪 Testing
```bash
npm test
```

Covers Vitest suites for all contracts, CLI, bots, and AI modules.

---

## 📚 Examples
Browse `/examples/basic-demo.ts` for a step-by-step walkthrough:
1. Deploy base & protocol wallets
2. Deploy folder & NFT contracts
3. Register issuers & mint credentials
4. On-chain interactions via CLI/SDK

---

## 🔧 Troubleshooting

### Common Issues

**"Secrets file not found"**
```bash
npm run secrets:setup
```

**"Docker not running"**
```bash
# Start Docker Desktop or Docker daemon
docker info  # Check if Docker is running
```

**"Container name already in use" or "Port already in use"**
```bash
# Quick cleanup
npm run cleanup:containers

# Full cleanup (if above doesn't work)
npm run cleanup:all

# Then try again
npm run quickstart
```

**Services won't start properly**
```bash
# Stop all services
npm run blockchain:stop
npm run standalone:stop

# Clean up containers and volumes
npm run blockchain:clean
npm run standalone:clean

# Start fresh
npm run quickstart
```

**Environment variables not loading**
```bash
# Check if secrets are decrypted
ls -la .env.secrets

# Re-decrypt if needed
npm run secrets:decrypt
```

### Cleanup Commands

| Command | Description |
|---------|-------------|
| `npm run cleanup:containers` | Remove MidnightForge containers |
| `npm run cleanup:all` | Full cleanup (containers + system prune) |
| `npm run blockchain:clean` | Clean blockchain volumes |
| `npm run standalone:clean` | Clean standalone volumes |

---

## 📝 Next Steps
- ✅ Merge and protect `main` via branch protection
- ✅ Add CI for `build`, `test`, and `deploy` workflows
- ✏️ Extend tests for edge cases (replay attacks, invalid states)
- 🔒 Conduct a security audit of all Compact circuits
- 🎨 Prototype a React UI using `mesh.js` and Midnight Lace
- 🤖 Deploy GitHub bots to a test org and refine issue workflows
- 🤖 Enhance AI engine for advanced collaboration insights

---

## 🤝 Contributing
We ❤️ community contributions!
1. Fork the repo & create a feature branch.
2. Write tests for new features.
3. Submit a PR and request a review.
4. Ensure CI checks pass before merging.

---

## 📜 License
This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements
- **Cardano & Midnight** for the selective-privacy foundation.
- **My dear friend, Charles Hoskinson** (He doesn't know me) for his extra-ordinary vision and for generally being awesome, showing me another way to be, and his relentless pursuit of the meaning of life.
- **Eric Romero and EddaLabs** for his vision and mentorship.
- **Community contributors** for testing and feedback.
- **Kapa.ai** and **GPT** for development insights.

*Crafted with 💜 by John Santi & the MidnightForge team.*
