/**
 * GitHub CLI wrapper utilities
 * Provides unified interface for executing gh commands with error handling and retry logic
 */

import { execSync, spawn } from 'child_process';
import { CLIError } from './error-handler.js';

/**
 * GitHub CLI specific error types
 */
export class GitHubAuthError extends CLIError {
  constructor(message) {
    super(`Authentication required: ${message}. Please run 'gh auth login'`, 401);
    this.name = 'GitHubAuthError';
  }
}

export class GitHubRateLimitError extends CLIError {
  constructor(message, resetTime) {
    super(`Rate limit exceeded: ${message}`, 429);
    this.name = 'GitHubRateLimitError';
    this.resetTime = resetTime;
  }
}

export class GitHubNetworkError extends CLIError {
  constructor(message) {
    super(`Network error: ${message}`, 503);
    this.name = 'GitHubNetworkError';
  }
}

/**
 * Analyze error message and return appropriate error type
 * @param {string} stderr - Error message from gh command
 * @param {number} code - Exit code
 * @returns {CLIError} Appropriate error instance
 */
function createGitHubError(stderr, code) {
  const errorMsg = stderr.toLowerCase();
  
  if (errorMsg.includes('authentication') || errorMsg.includes('token') || code === 4) {
    return new GitHubAuthError(stderr);
  }
  
  if (errorMsg.includes('rate limit') || errorMsg.includes('api rate limit exceeded')) {
    // Try to extract reset time if available
    const resetMatch = stderr.match(/try again in (\d+)/);
    const resetTime = resetMatch ? parseInt(resetMatch[1]) : null;
    return new GitHubRateLimitError(stderr, resetTime);
  }
  
  if (errorMsg.includes('network') || errorMsg.includes('connection') || errorMsg.includes('timeout')) {
    return new GitHubNetworkError(stderr);
  }
  
  return new CLIError(`gh command failed: ${stderr}`, code);
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute gh command with retry logic
 * @param {string[]} args - Arguments to pass to gh command
 * @param {object} options - Execution options
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<string>} Command output
 */
async function executeGHWithRetry(args, options = {}, retryCount = 0) {
  const maxRetries = options.maxRetries || 3;
  const baseDelay = options.baseDelay || 1000;
  
  try {
    return await executeGHRaw(args, options);
  } catch (error) {
    // Don't retry authentication errors
    if (error instanceof GitHubAuthError) {
      throw error;
    }
    
    // Retry network errors and rate limit errors
    if ((error instanceof GitHubNetworkError || error instanceof GitHubRateLimitError) && retryCount < maxRetries) {
      let delay = baseDelay * Math.pow(2, retryCount);
      
      // For rate limit errors, use the reset time if available
      if (error instanceof GitHubRateLimitError && error.resetTime) {
        delay = Math.max(delay, error.resetTime * 1000);
      }
      
      await sleep(delay);
      return executeGHWithRetry(args, options, retryCount + 1);
    }
    
    throw error;
  }
}

/**
 * Raw gh command execution without retry
 * @param {string[]} args - Arguments to pass to gh command
 * @param {object} options - Execution options
 * @returns {Promise<string>} Command output
 */
function executeGHRaw(args, options = {}) {
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
        reject(createGitHubError(stderr.trim(), code));
      }
    });

    child.on('error', (error) => {
      reject(new CLIError(`Failed to execute gh command: ${error.message}`));
    });
  });
}

/**
 * Base wrapper for executing gh commands
 * @param {string[]} args - Arguments to pass to gh command
 * @param {object} options - Execution options
 * @returns {Promise<string>} Command output
 */
export async function executeGH(args, options = {}) {
  return executeGHWithRetry(args, options);
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
  const args = [subcommand, '--repo', `${owner}/${repo}`];
  
  // Add JSON output for common commands that support it
  if (['release', 'pr', 'issue'].includes(subcommand) && !args.includes('--json')) {
    args.push('--json');
  }
  
  // Add additional options
  if (options.limit) {
    args.push('--limit', options.limit.toString());
  }
  
  if (options.state) {
    args.push('--state', options.state);
  }
  
  try {
    const output = await executeGH(args, options);
    
    // Try to parse as JSON if it looks like JSON
    if (output.trim().startsWith('{') || output.trim().startsWith('[')) {
      return JSON.parse(output);
    }
    
    return output;
  } catch (error) {
    if (error instanceof CLIError) {
      throw error;
    }
    throw new CLIError(`Repository operation failed: ${error.message}`);
  }
}