# 🌙 MidnightForge

[![Build Status](https://img.shields.io/github/actions/workflow/status/bytewizard42i/MidnightForge/ci.yml?branch=main)](https://github.com/bytewizard42i/MidnightForge/actions) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) [![Version](https://img.shields.io/github/v/release/bytewizard42i/MidnightForge)](https://github.com/bytewizard42i/MidnightForge/releases)

---

## 📖 Table of Contents
1. [✨ Overview](#-overview)
2. [🌟 Goals](#-goals)
3. [🚀 Key Features](#-key-features)
4. [📂 Repository Structure](#-repository-structure)
5. [🛠️ Getting Started](#️-getting-started)
6. [⚡ Build & Compile](#-build--compile)
7. [🚀 Deployment](#-deployment)
8. [💡 Automated DID Workflow](#-automated-did-workflow)
9. [🔍 AI-Powered Collaboration](#-ai-powered-collaboration)
10. [💻 Usage Example](#-usage-example)
11. [🧪 Testing](#-testing)
12. [📚 Examples](#-examples)
13. [📝 Next Steps](#-next-steps)
14. [🤝 Contributing](#-contributing)
15. [📜 License](#-license)
16. [🙏 Acknowledgements](#-acknowledgements)

---

## ✨ Overview
**MidnightForge** is a modular, protocol-level wallet system on Cardano’s Midnight selective-privacy blockchain. It enables:

- 🔒 **Privacy-Preserving DID NFTs** for verifiable credentials
- 📂 **Protocol level wallets with Folder-Based Smart Contracts** with pluggable logic per folder
- 🤖 **Automated GitHub Bots** and **AI Engines** for education, collaboration, and compensation
- ⚙️ **Seamless Integration** with Midnight Lace, CLI tools, and front-end SDKs

From **learning** to **earning**, MidnightForge orchestrates DID authorization, proof-of-participation, reputation, and micro-payments through an end-to-end workflow.

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
├── .github/                 # CI workflows & PR templates
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── COMPILER_SETUP.md        # Documentation for Compact compiler setup
├── CONTRIBUTING.md
├── DEVELOPMENT.md           # Comprehensive development guide
├── LICENSE
├── README.md
├── dev.sh                   # Development helper script
├── package.json
├── source-control-helper.sh # Git repository management script
├── tsconfig.json
├── vitest.config.ts
│
├── contract/                # Smart-contract code & SDK
│   ├── package.json         # Contract-specific dependencies and scripts
│   ├── .gitignore           # Contract-specific ignored files
│   ├── src/
│   │   ├── contracts/
│   │   │   ├── 01_protocol_wallet_base/
│   │   │   │   └── protocol_wallet_base.compact  # Core on-chain primitives
│   │   │   ├── 02_protocol_wallet/
│   │   │   │   ├── protocol_wallet.compact       # Folder registry management
│   │   │   │   ├── protocol_wallet_folder_contract.compact  # Per-folder permissions
│   │   │   │   └── protocol_wallet_issuer_contract.compact  # Trusted issuer registry
│   │   │   └── 03_DIDz_NFTs/
│   │   │       └── DIDz_NFT_contract.compact     # ZK-powered DID NFTs
│   │   ├── counter.compact  # Simple counter example contract
│   │   ├── minimal.compact  # Minimal example contract
│   │   ├── test.compact     # Test contract
│   │   ├── index.ts         # JS/TS SDK exports
│   │   ├── witnesses.ts     # Private state type definitions
│   │   ├── managed/         # Generated files (ignored by git)
│   │   │   ├── counter/     # Compiled counter contract
│   │   │   ├── minimal/     # Compiled minimal contract
│   │   │   └── test/        # Compiled test contract
│   │   └── test/           # Test suite for contracts
│   │       ├── 01_protocol_wallet_base.test.ts
│   │       ├── 02_protocol_wallet/
│   │       │   ├── folder_contract.test.ts
│   │       │   ├── issuer_contract.test.ts
│   │       │   └── protocol_wallet.test.ts
│   │       ├── 03_privacy_did_nft.test.ts
│   │       ├── counter-simulator.ts
│   │       ├── counter.test.ts
│   │       └── mocks/      # Mock implementations for testing
│   │           ├── compact-runtime.ts
│   │           ├── midnight-js-network-id.ts
│   │           └── midnight-js-testing.ts
│   ├── dist/               # Build output (ignored by git)
│   └── reports/            # Test reports (ignored by git)
│
├── counter-cli/             # CLI for example counter & protocol testing
│   ├── package.json
│   └── src/
│       ├── index.ts
│       └── test/           # CLI tests
│
├── scripts/                 # Shell helpers
│   └── deploy.sh
│
└── cleanup-branches.sh      # Script to clean up Git branches
```

---

## 🛠️ Getting Started
### Prerequisites
- **Node.js** ≥ v16.x & **npm**/yarn
- **CompactC** compiler (v1.x.x) in PATH
- **Cardano Node** & **Ogmius** for local testnet

### Installation
```bash
# Clone and install dependencies
git clone https://github.com/bytewizard42i/MidnightForge.git
cd MidnightForge
npm install

# Setup encrypted secrets (first time)
npm run secrets:setup
```

> **🔐 Secrets Management**: This project uses SOPS + age for encrypted environment variables. See [SECRETS.md](./SECRETS.md) for detailed setup instructions.

### 🚀 Quick Start - Standalone Mode
Run the complete application stack (blockchain + backend + frontend):

```bash
# Option 1: Using npm scripts
npm run standalone

# Option 2: Using the convenient shell script
./start-standalone.sh

# Option 3: Background mode
npm run standalone:detached
```

This will start:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Blockchain Infrastructure**: Indexer (8088), Node (9944), Proof Server (6300)

For detailed standalone setup instructions, see [STANDALONE.md](./STANDALONE.md).

---

## ⚡ Build & Compile
The build process utilizes `run-compactc`, an internal wrapper script that leverages the `CompactC` compiler. Ensure the `CompactC` compiler (v1.x.x) is installed and set the `COMPACT_HOME` environment variable to the directory containing the `compactc` executable.

```bash
npm run build:base     # Compile 01_protocol_wallet_base
npm run build:wallet   # Compile 02_protocol_wallet
npm run build:nft      # Compile 03_privacy_did_nft
npm run build          # All layers in order
```

---

## 🚀 Deployment
```bash
# Deploy contracts & bots via mesh.js
npm run deploy
# Or use the shell script
./scripts/deploy.sh
```

---

## 💡 Automated DID Workflow
1. **Onboard**: User registers DID via GitHub OAuth.
2. **Assess**: Bot issues learning quests; mints DID NFT upon completion.
3. **Collaborate**: AI engine assigns issues to qualified users.
4. **Verify**: Verifier bot checks DID proofs on PRs and updates reputation.
5. **Compensate**: Smart contracts release escrowed payments to contributor’s DID wallet.

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
