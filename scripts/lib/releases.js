/**
 * GitHub release information utilities
 */

import { ghAPI } from './github-cli.js';

/**
 * Get latest release information
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<object|null>} Latest release info or null if no releases
 */
export async function getLatestRelease(owner, repo) {
  try {
    const releaseData = await ghAPI(`repos/${owner}/${repo}/releases/latest`);

    // Skip prerelease versions
    if (releaseData.prerelease) {
      return null;
    }

    return formatReleaseData({
      tagName: releaseData.tag_name,
      publishedAt: releaseData.published_at,
      url: releaseData.html_url,
      isPrerelease: releaseData.prerelease,
    });
  } catch {
    // No releases found or other error
    return null;
  }
}

/**
 * Get release list
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} limit - Maximum number of releases to fetch
 * @returns {Promise<object[]>} Array of release information
 */
export async function getReleases(owner, repo, limit = 5) {
  try {
    const releases = await ghAPI(`repos/${owner}/${repo}/releases?per_page=${limit}`);

    // Filter out prereleases and format data
    return releases
      .filter((release) => !release.prerelease)
      .map((release) =>
        formatReleaseData({
          tagName: release.tag_name,
          publishedAt: release.published_at,
          url: release.html_url,
          isPrerelease: release.prerelease,
        })
      );
  } catch {
    // No releases found or other error
    return [];
  }
}

/**
 * Get latest tag as fallback when no releases exist
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<object|null>} Latest tag info or null if no tags
 */
export async function getLatestTag(owner, repo) {
  try {
    const tagsData = await ghAPI(`repos/${owner}/${repo}/tags`);

    if (!tagsData || tagsData.length === 0) {
      return null;
    }

    // Get the first (most recent) tag
    const latestTag = tagsData[0];

    return formatTagData(latestTag, owner, repo);
  } catch {
    // No tags found or other error
    return null;
  }
}

/**
 * Format release data to standardized format
 * @param {object} releaseData - Raw release data from GitHub API
 * @returns {object} Formatted release info
 */
export function formatReleaseData(releaseData) {
  return {
    version: releaseData.tagName,
    date: formatDate(releaseData.publishedAt),
    url: releaseData.url,
  };
}

/**
 * Format tag data to standardized format (fallback)
 * @param {object} tagData - Raw tag data from GitHub API
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {object} Formatted release info
 */
export function formatTagData(tagData, owner, repo) {
  return {
    version: tagData.name,
    date: null, // Tags don't have publish dates in the API response
    url: `https://github.com/${owner}/${repo}/releases/tag/${tagData.name}`,
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
