#!/usr/bin/env bun

/**
 * Main CLI entry point for app dashboard data updates
 */

import { program } from 'commander';
import { readFileSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load package.json for version information
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf-8')
);

// Initialize CLI program
program
  .name('update-data')
  .description('Update app development dashboard data from GitHub and iTunes APIs')
  .version(packageJson.version)
  .option('-v, --verbose', 'enable verbose logging')
  .option('-c, --config <path>', 'path to configuration file', 'config.json')
  .option('--dry-run', 'perform a dry run without saving data')
  .helpOption('-h, --help', 'display help for command');

// Parse command line arguments
program.parse(process.argv);

const options = program.opts();

// Main execution
console.log('App Dashboard Data Updater');
console.log('Version:', packageJson.version);

if (options.verbose) {
  console.log('Options:', options);
}

if (options.dryRun) {
  console.log('Running in dry-run mode - no data will be saved');
}

// Load configuration file
const configPath = resolve(process.cwd(), options.config);

if (!existsSync(configPath)) {
  console.error(`Error: Configuration file not found at ${configPath}`);
  process.exit(1);
}

let config;
try {
  const configContent = readFileSync(configPath, 'utf-8');
  config = JSON.parse(configContent);
  
  if (options.verbose) {
    console.log(`Loaded configuration from ${configPath}`);
    console.log('Configuration:', JSON.stringify(config, null, 2));
  }
} catch (error) {
  console.error(`Error: Failed to parse configuration file: ${error.message}`);
  process.exit(1);
}

// Validate configuration
if (!config.repositories || !Array.isArray(config.repositories)) {
  console.error('Error: Configuration must contain a "repositories" array');
  process.exit(1);
}

console.log(`Starting update process for ${config.repositories.length} repositories...`);