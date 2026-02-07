/**
 * Data merger for combining multiple API results into unified app data
 */

import { getRepositoryInfo } from './repository.js';
import { getLatestRelease } from './releases.js';
import { getCurrentMilestone } from './milestones.js';
import { getRecentPullRequests } from './pull-requests.js';
import { searchAppById } from './itunes-api.js';
import { searchAppById as searchPlayStoreAppById } from './play-store.js';

/**
 * Merge app data from multiple API sources
 * @param {object} repoConfig - Repository configuration object
 * @param {object} apiResults - Optional pre-fetched API results
 * @returns {Promise<object>} Complete app data object
 * @throws {Error} If required data cannot be retrieved or merged
 */
export async function mergeAppData(repoConfig, apiResults = {}) {
  if (!repoConfig || !repoConfig.repository) {
    throw new Error('Repository configuration with repository field is required');
  }

  try {
    // Parse repository string
    const [owner, repo] = repoConfig.repository.split('/');
    if (!owner || !repo) {
      throw new Error(`Invalid repository format: ${repoConfig.repository}`);
    }

    // Fetch all required data
    const repoData = apiResults.repository || (await getRepositoryInfo(owner, repo));
    const releaseData = apiResults.release || (await getLatestRelease(owner, repo));
    const milestoneData = apiResults.milestone || (await getCurrentMilestone(owner, repo));
    const prData = apiResults.prs || (await getRecentPullRequests(owner, repo));
    const itunesData =
      apiResults.itunes ||
      (repoConfig.appStoreId ? await searchAppById(repoConfig.appStoreId) : null);
    const playStoreData =
      apiResults.playStore ||
      (repoConfig.playStoreId ? await searchPlayStoreAppById(repoConfig.playStoreId) : null);

    // Map and normalize all data
    const mappedRepoData = mapRepositoryData(repoData);
    const mappedReleaseData = mapReleaseData(releaseData);
    const mappedStoreData = mapStoreData(itunesData, playStoreData);
    const mappedMilestoneData = mapMilestoneData(milestoneData);
    const mappedPRData = mapPRData(prData);

    // Create final app data structure
    const appData = createFinalAppData({
      repository: mappedRepoData,
      release: mappedReleaseData,
      store: mappedStoreData,
      milestone: mappedMilestoneData,
      prs: mappedPRData,
      config: repoConfig,
    });

    // Normalize and add timestamp
    return normalizeAppData(appData);
  } catch (error) {
    throw new Error(`Data merge failed for ${repoConfig.repository}: ${error.message}`, { cause: error });
  }
}

/**
 * Map repository data to standardized format
 * @param {object} repoInfo - Repository information from GitHub API
 * @returns {object} Mapped repository data
 */
function mapRepositoryData(repoInfo) {
  return {
    name: repoInfo.name,
    fullName: repoInfo.fullName,
    description: repoInfo.description,
    url: repoInfo.url,
    owner: repoInfo.owner,
    topics: repoInfo.topics,
    language: repoInfo.language,
  };
}

/**
 * Map release data to standardized format
 * @param {object|null} releaseInfo - Latest release information
 * @returns {object|null} Mapped release data
 */
function mapReleaseData(releaseInfo) {
  if (!releaseInfo) {
    return null;
  }

  return {
    version: releaseInfo.version,
    date: releaseInfo.date,
    url: releaseInfo.url,
  };
}

/**
 * Map store data (iTunes + Play Store) to standardized format
 * @param {object|null} itunesInfo - iTunes API data
 * @param {object|null} playStoreInfo - Play Store information
 * @param {object} repoConfig - Repository configuration
 * @returns {object} Mapped store data
 */
function mapStoreData(itunesInfo, playStoreInfo) {
  const storeData = {
    appStore: null,
    playStore: null,
  };

  if (itunesInfo) {
    storeData.appStore = {
      url: itunesInfo.appStoreUrl,
      version: itunesInfo.version,
      icon: itunesInfo.iconUrl,
      minimumOsVersion: itunesInfo.minimumOsVersion,
    };
  }

  if (playStoreInfo) {
    storeData.playStore = {
      url: playStoreInfo.playStoreUrl,
      version: playStoreInfo.version,
      icon: playStoreInfo.iconUrl,
      minimumSdkVersion: playStoreInfo.minimumSdkVersion,
    };
  }

  return storeData;
}

/**
 * Map milestone data to standardized format
 * @param {object|null} milestoneInfo - Milestone information
 * @returns {object|null} Mapped milestone data
 */
function mapMilestoneData(milestoneInfo) {
  if (!milestoneInfo) {
    return null;
  }

  return {
    title: milestoneInfo.title,
    openIssues: milestoneInfo.openIssues,
    closedIssues: milestoneInfo.closedIssues,
    totalIssues: milestoneInfo.totalIssues,
    progress: milestoneInfo.progress,
    url: milestoneInfo.url,
  };
}

/**
 * Map PR data to standardized format
 * @param {object[]} prInfo - Recent pull requests information
 * @returns {object[]} Mapped PR data
 */
function mapPRData(prInfo) {
  if (!Array.isArray(prInfo)) {
    return [];
  }

  return prInfo.map((pr) => ({
    number: pr.number,
    title: pr.title,
    url: pr.url,
    state: pr.state,
    ...(pr.mergedAt && { mergedAt: pr.mergedAt }),
  }));
}

/**
 * Create final app data structure
 * @param {object} mappedData - All mapped data components
 * @returns {object} Complete app data structure
 */
function createFinalAppData({ repository, release, store, milestone, prs, config }) {
  // Use platforms from config directly
  const platforms = config.platforms || [];

  // Choose the best icon URL
  const iconUrl = selectBestIcon(store, config);

  // Build links object
  const links = buildLinksObject(repository, store);

  // Build store versions object
  const storeVersions = buildStoreVersionsObject(store);

  return {
    id: config.id || repository.name.toLowerCase(),
    name: config.name || repository.name,
    repository: repository.fullName,
    platforms,
    icon: iconUrl,
    links,
    latestRelease: release,
    storeVersions,
    milestone,
    recentPRs: prs,
  };
}

/**
 * Normalize app data and add metadata
 * @param {object} appData - Raw app data
 * @returns {object} Normalized app data with timestamp
 */
function normalizeAppData(appData) {
  // Add last updated timestamp
  appData.lastUpdated = new Date().toISOString();

  // Normalize date formats
  if (appData.latestRelease && appData.latestRelease.date) {
    appData.latestRelease.date = normalizeDate(appData.latestRelease.date);
  }

  // Normalize PR merged dates
  if (appData.recentPRs) {
    appData.recentPRs = appData.recentPRs.map((pr) => ({
      ...pr,
      ...(pr.mergedAt && { mergedAt: normalizeDateTime(pr.mergedAt) }),
    }));
  }

  return appData;
}

/**
 * Select the best available icon URL
 * @param {object} storeData - Store data object
 * @param {object} config - Repository configuration
 * @returns {string|null} Best icon URL or null
 */
function selectBestIcon(storeData, config) {
  // Priority: config icon > iTunes icon > Play Store icon > placeholder
  if (config.icon) {
    return config.icon;
  }

  if (storeData.appStore && storeData.appStore.icon) {
    return storeData.appStore.icon;
  }

  if (storeData.playStore && storeData.playStore.icon) {
    return storeData.playStore.icon;
  }

  return 'https://via.placeholder.com/60';
}

/**
 * Build links object
 * @param {object} repoData - Repository data
 * @param {object} storeData - Store data
 * @param {object} config - Repository configuration
 * @returns {object} Links object
 */
function buildLinksObject(repoData, storeData) {
  const links = {
    github: repoData.url,
  };

  if (storeData.appStore && storeData.appStore.url) {
    links.appStore = storeData.appStore.url;
  }

  if (storeData.playStore && storeData.playStore.url) {
    links.playStore = storeData.playStore.url;
  }

  return links;
}

/**
 * Build store versions object
 * @param {object} storeData - Store data
 * @returns {object} Store versions object
 */
function buildStoreVersionsObject(storeData) {
  const storeVersions = {};

  if (storeData.appStore && storeData.appStore.version) {
    storeVersions.appStore = storeData.appStore.version;
  }

  if (storeData.playStore && storeData.playStore.version) {
    storeVersions.playStore = storeData.playStore.version;
  }

  return storeVersions;
}

/**
 * Normalize date string to YYYY-MM-DD format
 * @param {string} dateString - Date string in various formats
 * @returns {string} Normalized date string
 */
function normalizeDate(dateString) {
  if (!dateString) return null;

  try {
    return new Date(dateString).toISOString().split('T')[0];
  } catch {
    return dateString; // Return original if parsing fails
  }
}

/**
 * Normalize datetime string to ISO format
 * @param {string} dateTimeString - DateTime string in various formats
 * @returns {string} Normalized datetime string
 */
function normalizeDateTime(dateTimeString) {
  if (!dateTimeString) return null;

  try {
    return new Date(dateTimeString).toISOString();
  } catch {
    return dateTimeString; // Return original if parsing fails
  }
}
