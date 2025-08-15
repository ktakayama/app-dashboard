/**
 * Simple GitHub CLI wrapper utilities
 */

import { spawn } from 'child_process';

/**
 * Execute gh command and return output
 * @param {string[]} args - Arguments to pass to gh command
 * @returns {Promise<string>} Command output
 */
export async function executeGH(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('gh', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
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
        reject(new Error(`gh command failed: ${stderr.trim()}`));
      }
    });

    child.on('error', (error) => {
      reject(new Error(`Failed to execute gh command: ${error.message}`));
    });
  });
}

/**
 * Execute gh API command and parse JSON response
 * @param {string} endpoint - API endpoint
 * @returns {Promise<object>} Parsed JSON response
 */
export async function ghAPI(endpoint) {
  const output = await executeGH(['api', endpoint]);
  return JSON.parse(output);
}

/**
 * Execute repository-specific commands
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} command - Command to execute
 * @returns {Promise<string|object>} Command result
 */
export async function ghRepo(owner, repo, command) {
  const args = [command, '--repo', `${owner}/${repo}`];
  const output = await executeGH(args);

  // Try to parse as JSON if it looks like JSON
  if (output.trim().startsWith('{') || output.trim().startsWith('[')) {
    return JSON.parse(output);
  }

  return output;
}
