# MidnightForge Development Guide

This guide provides instructions for setting up and developing the MidnightForge project.

## Prerequisites

- **Node.js**: v22.15 or greater
- **Compact Compiler**: v0.23.0 or compatible version
- **Git**: Latest version

## Initial Setup

1. **Clone the Repository**

```bash
git clone https://github.com/bytewizard42i/MidnightForge.git
cd MidnightForge
```

2. **Install Dependencies**

```bash
npm install
```

3. **Set Up the Compact Compiler**

Follow the instructions in [COMPILER_SETUP.md](./COMPILER_SETUP.md) to set up the Compact compiler.

## Development Workflow

### Building the Project

1. **Compile Compact Contracts**

```bash
cd contract
npm run compact
```

2. **Build TypeScript Code**

```bash
npm run build
```

### Running Tests

```bash
npm test
```

### Source Control Management

We've provided helper scripts to manage source control:

- **Source Control Helper**: `./source-control-helper.sh`
  - `./source-control-helper.sh status` - Show repository status
  - `./source-control-helper.sh cleanup` - Clean up branches
  - `./source-control-helper.sh ignore` - Update ignore files
  - `./source-control-helper.sh sync` - Sync with remote

- **Branch Cleanup**: `./cleanup-branches.sh`
  - Helps clean up merged branches

### Branching Strategy

- `main` - Main development branch
- `fix/*` - Bug fixes
- `feature/*` - New features
- `chore/*` - Maintenance tasks
- `docs/*` - Documentation updates

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code changes that neither fix bugs nor add features
- `perf:` - Performance improvements
- `test:` - Adding or fixing tests
- `chore:` - Changes to the build process or auxiliary tools

## Project Structure

```
MidnightForge/
├── .github/                 # GitHub configuration files
├── contract/                # Smart contract code
│   ├── src/                 # Source code
│   │   ├── contracts/       # Compact contracts
│   │   ├── managed/         # Generated files (ignored by git)
│   │   └── test/            # Test files
│   └── dist/                # Build output (ignored by git)
├── counter-cli/             # CLI for interacting with contracts
└── scripts/                 # Helper scripts
```

## Troubleshooting

### Common Issues

1. **Compact Compiler Issues**

If you encounter issues with the Compact compiler:

```bash
# Check if the compiler is executable
chmod +x /path/to/compactc/compactc

# Check if the compiler is in your PATH
export PATH=$PATH:/path/to/compactc

# Use the --skip-zk flag for faster compilation during development
/path/to/compactc/compactc --skip-zk src/contracts/counter.compact src/managed/counter
```

2. **Source Control Issues**

If you see a large number of changes in your IDE:

```bash
# Reset the git index
git rm -r --cached .
git add .

# Update ignore files
./source-control-helper.sh ignore
```

## Additional Resources

- [Midnight Documentation](https://docs.midnight.network/)
- [Compact Language Guide](https://midnight.network/blog/compact-the-smart-contract-language-of-midnight)
