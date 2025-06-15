#!/usr/bin/env node

/**
 * =============================================================================
 * MIDNIGHT FORGE - ENVIRONMENT LOADER
 * =============================================================================
 * This script loads environment variables from the decrypted secrets file
 * and makes them available to the application.
 * 
 * Usage:
 *   node load-env.js [target]
 *   
 * Where target can be:
 *   - server: Load server-specific variables
 *   - webapp: Load webapp-specific variables (VITE_ prefixed)
 *   - all: Load all variables (default)
 * =============================================================================
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// File paths
const SECRETS_FILE = resolve(__dirname, '.env.secrets');
const EXAMPLE_FILE = resolve(__dirname, '.env.example');

/**
 * Parse environment file content
 */
function parseEnvFile(content) {
    const env = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
        // Skip comments and empty lines
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }
        
        // Parse KEY=VALUE pairs
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
            const [, key, value] = match;
            // Remove quotes if present
            const cleanValue = value.replace(/^["']|["']$/g, '');
            env[key.trim()] = cleanValue;
        }
    }
    
    return env;
}

/**
 * Load environment variables from secrets file
 */
function loadEnvironment(target = 'all') {
    let envFile = SECRETS_FILE;
    
    // Check if secrets file exists, fallback to example
    if (!existsSync(SECRETS_FILE)) {
        console.warn('⚠️  Secrets file not found, using example file');
        console.warn('   Run: npm run secrets:setup');
        envFile = EXAMPLE_FILE;
        
        if (!existsSync(EXAMPLE_FILE)) {
            console.error('❌ No environment files found!');
            process.exit(1);
        }
    }
    
    try {
        const content = readFileSync(envFile, 'utf8');
        const env = parseEnvFile(content);
        
        // Filter variables based on target
        let filteredEnv = env;
        
        if (target === 'server') {
            // Server variables (exclude VITE_ prefixed ones)
            filteredEnv = Object.fromEntries(
                Object.entries(env).filter(([key]) => !key.startsWith('VITE_'))
            );
        } else if (target === 'webapp') {
            // Webapp variables (only VITE_ prefixed ones)
            filteredEnv = Object.fromEntries(
                Object.entries(env).filter(([key]) => key.startsWith('VITE_'))
            );
        }
        
        // Set environment variables
        Object.assign(process.env, filteredEnv);
        
        const count = Object.keys(filteredEnv).length;
        console.log(`✅ Loaded ${count} environment variables for ${target}`);
        
        return filteredEnv;
        
    } catch (error) {
        console.error('❌ Failed to load environment variables:', error.message);
        process.exit(1);
    }
}

/**
 * Main execution
 */
if (import.meta.url === `file://${process.argv[1]}`) {
    const target = process.argv[2] || 'all';
    loadEnvironment(target);
}

export { loadEnvironment, parseEnvFile }; 