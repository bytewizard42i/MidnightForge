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
12. [🤝 Contributing](#-contributing)
13. [📜 License](#-license)
14. [🙏 Acknowledgements](#-acknowledgements)

---

## ✨ Overview

**MidnightForge** empowers developers and communities with a **foldered, protocol-level wallet** on Cardano’s Midnight network, featuring:

* 🔒 **Privacy-Preserving DID NFTs** as verifiable credentials
* 📂 **Folder-Based Smart Contracts** with pluggable logic per folder
* 🤖 **Automated Governance & Bots** for education, collaboration, and compensation
* ⚙️ **Seamless Wallet Integrations** (Midnight Lace, browser wallets)

By combining **DID authorization**, **proof-of-participation**, **proof-of-reputation**, and **proof-of-credentials**, MidnightForge creates a semi-decentralized ecosystem that guides contributors from learning to earning.

---

## 🌟 Goals

| 🎓 Education       | 🤝 Collaboration            | 💰 Compensation                |
| ------------------ | --------------------------- | ------------------------------ |
| Layered learn-path | Automated issue assignment  | Micro-payments via DID rewards |
| Credential tests   | Reputation-based workflows  | Escrow & milestone payouts     |
| Skill endorsements | Redundant tooling detection | GitHub bounty integrations     |

1. **Education**: Onboard via guided tutorials, automated DID-backed skill assessments, and credential issuance.
2. **Collaboration**: Match users to issues based on reputation & intent gleaned by AI bots; reward knowledge sharing.
3. **Compensation**: Authorize payouts through semi-decentralized schemas, ensuring transparent, on-chain settlements.

---

## 🚀 Key Features

| Layer                          | Functionality                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| **01\_protocol\_wallet\_base** | Core on-chain primitives: ownerKey, counters, base ledger types                                  |
| **02\_protocol\_wallet**       | Folder registry, permission contracts, issuer registry, and DID authorization circuits           |
| **03\_privacy\_did\_nft**      | ZK-powered DID NFTs for credentials, reputation proofs, and authority grants                     |
| **GitHub Bots**                | Deployable bots that auto-assign issues, verify DID proofs, and trigger payments                 |
| **AI-Intent Engine**           | Scans repos to identify redundancy, recommends collaborations, and curates educational resources |

---

## 📂 Repository Structure

```text
MidnightForge/
├── contracts/
│   ├── 01_protocol_wallet_base/
│   │   └── protocol_wallet_base.compact
│   ├── 02_protocol_wallet/
│   │   ├── protocol_wallet.compact
│   │   ├── folder_contract.compact
│   │   └── issuer_contract.compact
│   └── 03_privacy_did_nft/
│       └── did_nft.compact
│
├── bots/                  # GitHub bot implementations and configs
│   ├── assigner/          # auto-issue assignment logic
│   └── verifier/          # DID proof validation hooks
│
├── ai-engine/             # AI modules for intent detection & redundancy checks
│   └── intent.ts
│
├── mesh.js/
│   ├── deploy.ts          # Deployment scripts for contracts & bots
│   └── interfaces.ts      # TypeScript bindings
│
├── scripts/
│   └── deploy.sh
│
├── tests/
│   ├── 01_protocol_wallet_base.test.ts
│   ├── 02_protocol_wallet/
│   │   ├── protocol_wallet.test.ts
│   │   ├── folder_contract.test.ts
│   │   └── issuer_contract.test.ts
│   └── 03_privacy_did_nft.test.ts
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🛠️ Getting Started

### Prerequisites

* **Node.js** ≥ v16.x & **npm**/**yarn**
* **CompactC** compiler (v1.x.x)
* **Cardano Node** & **Ogmius** locally or testnet

### Installation

```bash
git clone https://github.com/bytewizard42i/MidnightForge.git
cd MidnightForge
npm install  # or yarn install
```

---

## ⚡ Build & Compile

```bash
npm run build:base     # Compile 01_protocol_wallet_base
npm run build:wallet   # Compile 02_protocol_wallet
npm run build:nft      # Compile 03_privacy_did_nft
npm run build          # All layers in order
```

---

## 🚀 Deployment

```bash
# Deploy smart contracts & bots via mesh.js
npm run deploy
# Or using shell helper
yes "./scripts/deploy.sh"
```

---

## 💡 Automated DID Workflow

1. **Onboard**: User signs up via Discord/GitHub OAuth and submits DID.
2. **Assess**: Bot issues educational quests; upon completion, DID NFT credential is minted.
3. **Collaborate**: AI engine analyzes open issues, assigns based on skills & reputation.
4. **Verify**: Bot validates DID proofs on PRs, updates reputation.
5. **Compensate**: Upon merge, smart-contract escrow releases payment to contributor’s DID wallet.

---

## 🔍 AI-Powered Collaboration

* **Intent Gleaning**: AI scans repo activity, labels issues by topic & skill.
* **Redundancy Detection**: Flags duplicate tooling efforts, suggests merging work.
* **Incentive Matching**: Recommends collaborators and sets micro-bounties automatically.

---

## 💻 Usage Example

```ts
import { ProtocolWallet } from "./mesh.js/interfaces";
import { GitHubAssignerBot } from "./bots/assigner";

async function main() {
  const wallet = new ProtocolWallet(signer);
  await wallet.createFolder("Advanced Tutorials");
  await wallet.registerIssuer("EduBot", eduBotKey);

  const bot = new GitHubAssignerBot(wallet, "org/MidnightForge");
  bot.start();  // auto-assign educational issues
}
```

---

## 🧪 Testing

```bash
npm test
```

Ensure all unit & integration tests pass, including bot hooks and AI engine modules.

---

## 🤝 Contributing

1. Fork & clone the repo.
2. Create a feature branch (`feature/awesome`).
3. Write tests for your changes.
4. Submit a PR; ensure CI and peer reviews complete.

**We ❤ community-driven growth!**

---

## 📜 License

Released under the MIT License. See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

* **Cardano & Midnight** for the selective-privacy foundation.
* **EnterpriseZK Labs** for vision and support.
* **Community Contributors** for feedback, testing, and ideas.

*Built with 💜 by EnterpriseZK Labs & the MidnightForge community with collaboration of Eddalabs mentorship.*
