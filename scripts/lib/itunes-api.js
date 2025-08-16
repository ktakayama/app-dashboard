/**
 * iTunes Lookup API integration for App Store data retrieval
 */

const ITUNES_LOOKUP_BASE_URL = 'https://itunes.apple.com/lookup';

/**
 * Make HTTP request to iTunes Lookup API
 * @param {string} url - Complete API URL with parameters
 * @returns {Promise<object>} iTunes API response
 * @throws {Error} When API request fails
 */
async function fetchFromItunes(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`iTunes API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Network error accessing iTunes API: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Search app by App Store ID from iTunes Lookup API
 * @param {string|number} appId - App Store ID (e.g., "6446930619" or 6446930619)
 * @returns {Promise<object|null>} App Store information or null if not found
 */
export async function searchAppById(appId) {
  if (!appId) {
    return null;
  }

  try {
    const searchParams = new URLSearchParams({
      id: appId.toString(),
      country: 'jp',
    });

    const url = `${ITUNES_LOOKUP_BASE_URL}?${searchParams.toString()}`;
    const response = await fetchFromItunes(url);

    if (!response.results || response.results.length === 0) {
      return null;
    }

    const appData = response.results[0];
    return formatAppStoreInfo(appData);
  } catch (error) {
    console.warn(`Failed to search app by ID "${appId}":`, error.message);
    return null;
  }
}

/**
 * Format iTunes API response data to standardized app info
 * @param {object} itunesData - Raw iTunes API response data
 * @returns {object} Formatted app store information
 */
export function formatAppStoreInfo(itunesData) {
  if (!itunesData || typeof itunesData !== 'object') {
    return {
      appStoreUrl: null,
      version: null,
      iconUrl: null,
      minimumOsVersion: null,
    };
  }

  return {
    appStoreUrl: itunesData.trackViewUrl || null,
    version: itunesData.version || null,
    iconUrl: getHighResolutionIconUrl(itunesData),
    minimumOsVersion: itunesData.minimumOsVersion || null,
  };
}

/**
 * Extract highest resolution app icon URL from iTunes data
 * @param {object} itunesData - Raw iTunes API response data
 * @returns {string|null} High resolution icon URL or null if not available
 */
function getHighResolutionIconUrl(itunesData) {
  if (!itunesData) {
    return null;
  }

  // Priority order: artworkUrl512 > artworkUrl100 > artworkUrl60
  if (itunesData.artworkUrl512) {
    return itunesData.artworkUrl512;
  }

  if (itunesData.artworkUrl100) {
    // Try to get 512x512 version by replacing the size in URL
    return itunesData.artworkUrl100.replace(/100x100bb/, '512x512bb');
  }

  if (itunesData.artworkUrl60) {
    // Try to get 512x512 version by replacing the size in URL
    return itunesData.artworkUrl60.replace(/60x60bb/, '512x512bb');
  }

  return null;
}
