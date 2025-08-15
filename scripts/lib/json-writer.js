/**
 * JSON writer utilities for app data output formatting
 */

import { promises as fs } from 'fs';
import { dirname } from 'path';
import { CLIError } from './error-handler.js';

/**
 * Main function to write apps data to JSON file
 * @param {Array<object>} appsData - Array of merged app data objects
 * @param {string} outputPath - Output file path (default: src/data/apps.json)
 * @param {object} logger - Logger instance for output messages
 * @returns {Promise<void>}
 * @throws {CLIError} If write operation fails
 */
export async function writeAppsJson(
  appsData,
  outputPath = 'src/data/apps.json',
  logger
) {
  if (!Array.isArray(appsData)) {
    throw new CLIError('Apps data must be an array');
  }

  if (!logger) {
    throw new CLIError('Logger instance is required');
  }

  try {
    logger.verbose(`Starting JSON write process for ${appsData.length} apps`);

    // Ensure output directory exists
    await ensureDirectory(dirname(outputPath));
    logger.verbose(`Output directory created/verified: ${dirname(outputPath)}`);

    // Create backup if file exists
    await createBackup(outputPath, logger);

    // Format JSON data
    const jsonData = formatAppsJson(appsData);
    logger.verbose('JSON data formatted successfully');

    // Write to file atomically using temporary file
    await writeFileAtomically(outputPath, jsonData, logger);

    // Verify written file
    await verifyJsonOutput(outputPath, jsonData, logger);

    // Calculate file size for success message
    const stats = await fs.stat(outputPath);
    const fileSizeKB = Math.round((stats.size / 1024) * 100) / 100;

    logger.success(
      `JSON file written successfully: ${outputPath} (${fileSizeKB} KB)`
    );
    logger.success(`Total apps exported: ${appsData.length}`);
  } catch (error) {
    if (error instanceof CLIError) {
      throw error;
    }
    throw new CLIError(`Failed to write JSON file: ${error.message}`);
  }
}

/**
 * Format app data into standard JSON structure
 * @param {Array<object>} appsData - Array of app data objects
 * @returns {string} Formatted JSON string with 2-space indentation
 */
function formatAppsJson(appsData) {
  const jsonStructure = {
    apps: appsData,
    lastUpdated: new Date().toISOString(),
    totalApps: appsData.length,
  };

  return JSON.stringify(jsonStructure, null, 2) + '\n';
}

/**
 * Create backup of existing file
 * @param {string} filePath - Original file path
 * @param {object} logger - Logger instance
 * @returns {Promise<void>}
 */
async function createBackup(filePath, logger) {
  try {
    await fs.access(filePath);
    const backupPath = `${filePath}.backup`;
    await fs.copyFile(filePath, backupPath);
    logger.verbose(`Backup created: ${backupPath}`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      logger.verbose('No existing file to backup');
    } else {
      throw new CLIError(`Failed to create backup: ${error.message}`);
    }
  }
}

/**
 * Ensure directory exists, create if necessary
 * @param {string} dirPath - Directory path to create
 * @returns {Promise<void>}
 */
async function ensureDirectory(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    throw new CLIError(
      `Failed to create directory ${dirPath}: ${error.message}`
    );
  }
}

/**
 * Write file atomically using temporary file
 * @param {string} outputPath - Final output path
 * @param {string} jsonData - JSON data to write
 * @param {object} logger - Logger instance
 * @returns {Promise<void>}
 */
async function writeFileAtomically(outputPath, jsonData, logger) {
  const tempPath = `${outputPath}.tmp`;

  try {
    // Write to temporary file first
    await fs.writeFile(tempPath, jsonData, 'utf8');
    logger.verbose(`Temporary file written: ${tempPath}`);

    // Atomically move to final location
    await fs.rename(tempPath, outputPath);
    logger.verbose(`File moved to final location: ${outputPath}`);
  } catch (error) {
    // Clean up temporary file if it exists
    try {
      await fs.unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }

    throw new CLIError(`Failed to write file atomically: ${error.message}`);
  }
}

/**
 * Verify written JSON file matches expected data
 * @param {string} filePath - Path to written file
 * @param {string} expectedData - Expected JSON data string
 * @param {object} logger - Logger instance
 * @returns {Promise<void>}
 */
async function verifyJsonOutput(filePath, expectedData, logger) {
  try {
    const writtenData = await fs.readFile(filePath, 'utf8');

    // Parse both to compare structure (not exact string match due to formatting)
    const writtenJson = JSON.parse(writtenData);
    const expectedJson = JSON.parse(expectedData);

    if (writtenJson.totalApps !== expectedJson.totalApps) {
      throw new CLIError('Written file validation failed: app count mismatch');
    }

    if (writtenJson.apps.length !== expectedJson.apps.length) {
      throw new CLIError(
        'Written file validation failed: apps array length mismatch'
      );
    }

    logger.verbose('JSON file verification completed successfully');
  } catch (error) {
    if (error instanceof CLIError) {
      throw error;
    }
    throw new CLIError(`Failed to verify written file: ${error.message}`);
  }
}
