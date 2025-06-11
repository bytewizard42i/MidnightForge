# Compact Compiler Setup

This document provides instructions for setting up the Compact compiler for the MidnightForge project.

## Prerequisites

- Node.js v22.15 or greater
- Compact compiler v0.23.0 or compatible version

## Compiler Location

The Compact compiler is located at:

```
/home/js/utils_Midnight/my-binaries/compactc/compactc
```

## Compiler Structure

The compiler directory contains:
- `compactc` - Shell script wrapper
- `compactc.bin` - Actual binary executable
- `lib/` - Directory containing standard library files
- `zkir` - Zero-knowledge intermediate representation tool

## Usage

When compiling Compact contracts, use the `--skip-zk` flag to skip ZK key generation:

```bash
/home/js/utils_Midnight/my-binaries/compactc/compactc --skip-zk src/contracts/counter.compact src/managed/counter
```

## Troubleshooting

If you encounter issues with the compiler:

1. Ensure the compiler is executable: `chmod +x /home/js/utils_Midnight/my-binaries/compactc/compactc`
2. Ensure the compiler is in your PATH: `export PATH=$PATH:/home/js/utils_Midnight/my-binaries/compactc`
3. Check that the `COMPACT_PATH` environment variable is set correctly: `export COMPACT_PATH=/home/js/utils_Midnight/my-binaries/compactc/lib/`
