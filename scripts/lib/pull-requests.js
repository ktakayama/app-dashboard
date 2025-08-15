/**
 * GitHub pull request information utilities
 */

import { executeGH } from './github-cli.js';

/**
 * Get recent pull requests for a repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} limit - Maximum number of PRs to return (default: 3)
 * @returns {Promise<object[]>} Array of recent pull request information
 */
export async function getRecentPullRequests(owner, repo, limit = 3) {
  try {
    // Get PRs with different states to ensure we get recent activity
    const [openPRs, mergedPRs, closedPRs] = await Promise.all([
      getPRsByState(owner, repo, 'open', 5),
      getPRsByState(owner, repo, 'merged', 5),
      getPRsByState(owner, repo, 'closed', 5),
    ]);

    // Combine and remove duplicates by PR number
    const allPRs = [...openPRs, ...mergedPRs, ...closedPRs];
    const uniquePRs = removeDuplicatePRs(allPRs);
    const sortedPRs = sortPRsByUpdateTime(uniquePRs);

    // Return top N PRs
    return sortedPRs.slice(0, limit).map(normalizePRState);
  } catch (error) {
    console.error(`Failed to get pull requests for ${owner}/${repo}:`, error);
    return [];
  }
}

/**
 * Get pull requests by state
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} state - PR state (open, merged, closed)
 * @param {number} limit - Maximum number of PRs to fetch
 * @returns {Promise<object[]>} Array of pull requests
 */
async function getPRsByState(owner, repo, state, limit = 5) {
  try {
    const args = [
      'pr',
      'list',
      '--repo',
      `${owner}/${repo}`,
      '--state',
      state,
      '--limit',
      limit.toString(),
      '--json',
      'number,title,url,state,mergedAt,closedAt,updatedAt',
    ];

    const output = await executeGH(args);
    return JSON.parse(output);
  } catch (error) {
    console.error(
      `Failed to get ${state} PRs for ${owner}/${repo}:`,
      error.message
    );
    return [];
  }
}

/**
 * Get detailed information for a specific pull request
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} number - PR number
 * @returns {Promise<object|null>} PR details or null if not found
 */
export async function getPullRequestDetails(owner, repo, number) {
  try {
    const args = [
      'pr',
      'view',
      number.toString(),
      '--repo',
      `${owner}/${repo}`,
      '--json',
      'number,title,url,state,mergedAt,closedAt,updatedAt',
    ];

    const output = await executeGH(args);
    return JSON.parse(output);
  } catch (error) {
    console.error(
      `Failed to get PR #${number} for ${owner}/${repo}:`,
      error.message
    );
    return null;
  }
}

/**
 * Normalize PR state and format data
 * @param {object} pr - Raw PR data from GitHub CLI
 * @returns {object} Normalized PR information
 */
export function normalizePRState(pr) {
  return {
    number: pr.number,
    title: pr.title,
    url: pr.url,
    state: pr.state.toLowerCase(),
    mergedAt: pr.mergedAt || null,
  };
}

/**
 * Remove duplicate PRs by number (keep the first occurrence)
 * @param {object[]} prs - Array of PR objects
 * @returns {object[]} Array of unique PRs
 */
function removeDuplicatePRs(prs) {
  const seen = new Set();
  return prs.filter((pr) => {
    if (seen.has(pr.number)) {
      return false;
    }
    seen.add(pr.number);
    return true;
  });
}

/**
 * Sort PRs by update time (newest first)
 * @param {object[]} prs - Array of PR objects
 * @returns {object[]} Sorted array of PRs
 */
function sortPRsByUpdateTime(prs) {
  return prs.sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.mergedAt || a.closedAt);
    const timeB = new Date(b.updatedAt || b.mergedAt || b.closedAt);
    return timeB - timeA; // Newest first
  });
}
