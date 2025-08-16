#!/usr/bin/env bun

/**
 * Main CLI entry point for app dashboard data updates
 */

import { program } from 'commander';
import { readFileSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from './lib/logger.js';
import { CLIError, handleError, setupGlobalErrorHandlers } from './lib/error-handler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load package.json for version information
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));

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

// Initialize logger and error handling
const logger = createLogger(options.verbose);
setupGlobalErrorHandlers(logger);

// Main execution
try {
  logger.info('App Dashboard Data Updater');
  logger.info(`Version: ${packageJson.version}`);

  if (options.verbose) {
    logger.verbose('Command line options:', options);
  }

  if (options.dryRun) {
    logger.info('Running in dry-run mode - no data will be saved');
  }

  // Load configuration file
  const configPath = resolve(process.cwd(), options.config);

  if (!existsSync(configPath)) {
    throw new CLIError(`Configuration file not found at ${configPath}`);
  }

  let config;
  try {
    const configContent = readFileSync(configPath, 'utf-8');
    config = JSON.parse(configContent);

    if (options.verbose) {
      logger.verbose(`Loaded configuration from ${configPath}`);
      logger.verbose('Configuration:', JSON.stringify(config, null, 2));
    }
  } catch (error) {
    throw new CLIError(`Failed to parse configuration file: ${error.message}`);
  }

  // Validate configuration
  if (!config.repositories || !Array.isArray(config.repositories)) {
    throw new CLIError('Configuration must contain a "repositories" array');
  }

  logger.info(`Starting update process for ${config.repositories.length} repositories...`);

  // Start main processing workflow
  const startTime = Date.now();
  await processAllApps(config, options, logger);
  const endTime = Date.now();
  const duration = Math.round(((endTime - startTime) / 1000) * 100) / 100;

  logger.success(`Update completed in ${duration}s`);
} catch (error) {
  handleError(error, logger);
}

/**
 * Main processing workflow for all apps
 * @param {object} config - Configuration object
 * @param {object} options - CLI options
 * @param {object} logger - Logger instance
 */
async function processAllApps(config, options, logger) {
  const { mergeAppData } = await import('./lib/data-merger.js');
  const { writeAppsJson } = await import('./lib/json-writer.js');

  // Process all apps in parallel with error handling
  logger.info('Processing all apps in parallel...');

  const results = await Promise.allSettled(
    config.repositories.map(async (repoConfig) => {
      logger.verbose(`Processing ${repoConfig.repository}...`);
      const appData = await mergeAppData(repoConfig);
      logger.verbose(`✓ Completed ${repoConfig.repository}`);
      return appData;
    })
  );

  // Collect successful results and log errors
  const successfulApps = [];
  const failedApps = [];

  results.forEach((result, index) => {
    const repoConfig = config.repositories[index];
    if (result.status === 'fulfilled') {
      successfulApps.push(result.value);
    } else {
      failedApps.push({
        repository: repoConfig.repository,
        error: result.reason.message,
      });
      logger.error(`Failed to process ${repoConfig.repository}: ${result.reason.message}`);
    }
  });

  // Log processing summary
  logger.info(`Successfully processed: ${successfulApps.length}`);
  if (failedApps.length > 0) {
    logger.warn(`Failed to process: ${failedApps.length}`);
  }

  // Write output file if we have any successful apps
  if (successfulApps.length > 0) {
    if (!options.dryRun) {
      const outputPath = config.outputPath || 'src/data/apps.json';
      await writeAppsJson(successfulApps, outputPath, logger);
    } else {
      logger.info('Dry run mode - skipping file write');
      logger.info(
        `Would write ${successfulApps.length} apps to ${config.outputPath || 'src/data/apps.json'}`
      );
    }
  } else {
    throw new CLIError('No apps were successfully processed');
  }
}
