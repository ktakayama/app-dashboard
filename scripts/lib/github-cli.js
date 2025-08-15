/**
 * GitHub CLI wrapper utilities
 * Provides unified interface for executing gh commands with error handling and retry logic
 */

import { execSync, spawn } from 'child_process';
import { CLIError } from './error-handler.js';

/**
 * Base wrapper for executing gh commands
 * @param {string[]} args - Arguments to pass to gh command
 * @param {object} options - Execution options
 * @returns {Promise<string>} Command output
 */
export async function executeGH(args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('gh', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new CLIError(`gh command failed: ${stderr.trim()}`, code));
      }
    });

    child.on('error', (error) => {
      reject(new CLIError(`Failed to execute gh command: ${error.message}`));
    });
  });
}

/**
 * Execute gh API commands with automatic JSON parsing
 * @param {string} endpoint - API endpoint (e.g., 'repos/owner/repo')
 * @param {object} options - Request options
 * @returns {Promise<object>} Parsed JSON response
 */
export async function ghAPI(endpoint, options = {}) {
  const args = ['api', endpoint];
  
  // Add common options
  if (options.method) {
    args.push('--method', options.method);
  }
  
  try {
    const output = await executeGH(args, options);
    return JSON.parse(output);
  } catch (error) {
    if (error instanceof CLIError) {
      throw error;
    }
    throw new CLIError(`Failed to parse JSON response: ${error.message}`);
  }
}

/**
 * Repository-specific operations
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name  
 * @param {string} subcommand - Subcommand to execute
 * @param {object} options - Command options
 * @returns {Promise<object>} Command result
 */
export async function ghRepo(owner, repo, subcommand, options = {}) {
  // TODO: Implement repository operations
  throw new Error('Not implemented');
}