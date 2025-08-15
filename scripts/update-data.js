#!/usr/bin/env bun

/**
 * Main CLI entry point for app dashboard data updates
 */

import { program } from 'commander';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
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

console.log('Starting update process...');