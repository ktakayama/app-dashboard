/**
 * Google Play Store API integration for Android app data retrieval
 */

import gplay from 'google-play-scraper';

/**
 * Search app by package ID from Google Play Store
 * @param {string} packageId - Android package ID (e.g., "com.example.app")
 * @returns {Promise<object|null>} Play Store information or null if not found
 */
export async function searchAppById(packageId) {
  if (!packageId) {
    return null;
  }

  try {
    const appData = await gplay.app({
      appId: packageId,
      lang: 'ja',
      country: 'jp',
    });

    return formatPlayStoreInfo(appData);
  } catch (error) {
    console.warn(
      `Failed to search app by package ID "${packageId}":`,
      error.message
    );
    return null;
  }
}

/**
 * Format Play Store response data to standardized app info
 * @param {object} playStoreData - Raw Play Store response data
 * @returns {object} Formatted Play Store information
 */
export function formatPlayStoreInfo(playStoreData) {
  if (!playStoreData || typeof playStoreData !== 'object') {
    return {
      playStoreUrl: null,
      version: null,
      packageId: null,
    };
  }

  return {
    playStoreUrl: playStoreData.url || null,
    version: playStoreData.version || null,
    packageId: playStoreData.appId || null,
  };
}
