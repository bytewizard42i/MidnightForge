# 🚀 MidnightForge

[![Build Status](https://img.shields.io/github/actions/workflow/status/bytewizard42i/MidnightForge/ci.yml?branch=main)](https://github.com/bytewizard42i/MidnightForge/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/github/v/release/bytewizard42i/MidnightForge)](https://github.com/bytewizard42i/MidnightForge/releases)

---

## 📖 Overview

**MidnightForge** is a protocol-level, foldered smart-contract wallet system built on Cardano’s Midnight selective-privacy blockchain. It offers:

* 🔒 **Privacy-preserving DID NFTs**
* 📂 **Folder-based organization** with custom smart-contract logic per folder
* 🤝 **Trusted issuer registry** for credential management
* ⚙️ **Seamless integration** with Midnight Lace & other popular wallets

## 🌟 Key Features

| Layer                    | Description                                                             |
| ------------------------ | ----------------------------------------------------------------------- |
| **Protocol Wallet Base** | Minimal on-chain primitives: owner key, counter, and core ledger types  |
| **Folder Contracts**     | User-defined folders with lifecycle management & permission enforcement |
| **Issuer Contracts**     | Registry of trusted issuers for mutable/immutable credential issuance   |
| **Privacy DID NFTs**     | ZK credential NFTs compliant with CIP-68 & CIP-143                      |

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
├── tests/
│   ├── 01_protocol_wallet_base.test.ts
│   ├── 02_protocol_wallet/
│   │   ├── protocol_wallet.test.ts
│   │   ├── folder_contract.test.ts
│   │   └── issuer_contract.test.ts
│   └── 03_privacy_did_nft.test.ts
│
├── mesh.js/
│   ├── deploy.ts
│   └── interfaces.ts
│
├── scripts/
│   └── deploy.sh
│
├── package.json
├── tsconfig.json
└── README.md
```

## 🛠️ Getting Started

### Prerequisites

* **Node.js** ≥ v16.x
* **npm** or **yarn**
* **CompactC** compiler (v1.x.x)
* **Cardano Node** & **Ogmius** for local testnet environments

### Installation

```bash
# Clone the repo
git clone https://github.com/bytewizard42i/MidnightForge.git
cd MidnightForge

# Install JS dependencies
npm install  # or yarn install
```

## ⚡ Build & Compile

Compile your Compact Contracts in sequence:

```bash
npm run build:base     # 01_protocol_wallet_base
npm run build:wallet   # 02_protocol_wallet
npm run build:nft      # 03_privacy_did_nft
# Or simply:
npm run build
```

## 🚀 Deployment

Deploy on-chain using **mesh.js**:

```bash
# Deploy via JS script
npm run deploy

# Or use the shell helper
./scripts/deploy.sh
```

## 💻 Usage Example

```ts
import { ProtocolWallet } from "./mesh.js/interfaces";

async function main() {
  const wallet = new ProtocolWallet(/* provider & signer */);
  await wallet.createFolder("My Credentials");
  await wallet.registerIssuer("UniversityX", uniXPublicKey);
  const folderList = await wallet.listFolders();
  console.log(folderList);
}
```

## 🧪 Testing

```bash
npm test
```

Ensure all unit & integration tests pass before opening a PR.

## 🤝 Contributing

We ❤️ contributions! Please follow these guidelines:

1. **Fork** the repo and create a feature branch (`feature/my-feature`).
2. **Write tests** for new functionality.
3. **Open a Pull Request**, describing your changes.
4. Ensure **CI checks** pass and **at least one review** is approved.

*For major changes*, please open an issue first to discuss what you’d like to change.

## 📜 License

This project is licensed under the **APACHE License**. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

* **Cardano & Midnight** teams for building the selective-privacy foundation.
* **Community Contributors** for feedback, testing, and ideas.
* **EnterpriseZK Labs** for sponsorship and vision.

---

*Crafted with ❤️ by EnterpriseZK Labs in collaboration with Eddalabs mentorship*
