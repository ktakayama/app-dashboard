/**
 * GitHub milestone information utilities
 */

import { ghAPI } from './github-cli.js';

/**
 * Get all milestones for a repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<object[]>} Array of milestone information
 */
export async function getMilestones(owner, repo) {
  try {
    const milestones = await ghAPI(`repos/${owner}/${repo}/milestones`);

    // Filter only open milestones
    return milestones.filter((milestone) => milestone.state === 'open');
  } catch {
    // No milestones found or other error
    return [];
  }
}

/**
 * Get current active milestone based on semantic versioning
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<object|null>} Current milestone info or null if no milestones
 */
export async function getCurrentMilestone(owner, repo) {
  try {
    const milestones = await getMilestones(owner, repo);

    if (milestones.length === 0) {
      return null;
    }

    // Find the milestone with the lowest semantic version number
    const activeMilestone = findActiveMilestone(milestones);

    if (!activeMilestone) {
      return null;
    }

    return formatMilestoneData(activeMilestone);
  } catch {
    return null;
  }
}

/**
 * Calculate progress percentage
 * @param {number} openIssues - Number of open issues
 * @param {number} closedIssues - Number of closed issues
 * @returns {number} Progress percentage (0-100)
 */
export function calculateProgress(openIssues, closedIssues) {
  const totalIssues = openIssues + closedIssues;

  if (totalIssues === 0) {
    return 0;
  }

  return Math.round((closedIssues / totalIssues) * 100);
}

/**
 * Find the active milestone by selecting the one with the lowest semantic version
 * @param {object[]} milestones - Array of milestone objects
 * @returns {object|null} Active milestone or null
 */
function findActiveMilestone(milestones) {
  if (milestones.length === 0) {
    return null;
  }

  // Sort milestones by semantic version (ascending)
  const sortedMilestones = milestones
    .filter((milestone) => milestone.title)
    .sort((a, b) => compareSemanticVersions(a.title, b.title));

  return sortedMilestones[0] || null;
}

/**
 * Compare two semantic version strings
 * @param {string} versionA - First version string
 * @param {string} versionB - Second version string
 * @returns {number} Comparison result (-1, 0, 1)
 */
function compareSemanticVersions(versionA, versionB) {
  // Extract version numbers from titles like "v2.2.0 - Winter Update"
  const extractVersion = (title) => {
    const match = title.match(/v?(\d+)\.(\d+)\.(\d+)/);
    if (!match) return null;
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
  };

  const versionDataA = extractVersion(versionA);
  const versionDataB = extractVersion(versionB);

  // If one has no version data, put it after the one with version data
  if (!versionDataA && !versionDataB) return 0;
  if (!versionDataA) return 1;
  if (!versionDataB) return -1;

  const [majorA, minorA, patchA] = versionDataA;
  const [majorB, minorB, patchB] = versionDataB;

  if (majorA !== majorB) return majorA - majorB;
  if (minorA !== minorB) return minorA - minorB;
  return patchA - patchB;
}

/**
 * Format milestone data to standardized format
 * @param {object} milestoneData - Raw milestone data from GitHub API
 * @returns {object} Formatted milestone info
 */
function formatMilestoneData(milestoneData) {
  const openIssues = milestoneData.open_issues || 0;
  const closedIssues = milestoneData.closed_issues || 0;
  const totalIssues = openIssues + closedIssues;

  return {
    title: milestoneData.title,
    openIssues,
    closedIssues,
    totalIssues,
    progress: calculateProgress(openIssues, closedIssues),
    dueOn: milestoneData.due_on ? formatDate(milestoneData.due_on) : null,
    url: milestoneData.html_url,
  };
}

/**
 * Format date string to ISO date format (YYYY-MM-DD)
 * @param {string} dateString - ISO date string from GitHub API
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
  if (!dateString) return null;
  return new Date(dateString).toISOString().split('T')[0];
}
