/**
 * Test for Play Store API integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchAppById, formatPlayStoreInfo } from '../../scripts/lib/play-store.js';

// Mock the google-play-scraper module
vi.mock('google-play-scraper', () => ({
  default: {
    app: vi.fn(),
  },
}));

describe('Play Store API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('should format play store data correctly', () => {
    const mockData = {
      url: 'https://play.google.com/store/apps/details?id=com.example.app',
      version: '1.0.0',
      appId: 'com.example.app',
    };

    const result = formatPlayStoreInfo(mockData);

    expect(result).toEqual({
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.example.app',
      version: '1.0.0',
      packageId: 'com.example.app',
    });
  });

  it('should handle null input gracefully', () => {
    const result = formatPlayStoreInfo(null);

    expect(result).toEqual({
      playStoreUrl: null,
      version: null,
      packageId: null,
    });
  });

  it('should search app by package ID successfully', async () => {
    const packageId = 'com.example.app';
    const mockAppData = {
      url: 'https://play.google.com/store/apps/details?id=com.example.app',
      version: '1.2.3',
      appId: 'com.example.app',
    };

    // Import the mock after the module is mocked
    const gplay = await import('google-play-scraper');
    gplay.default.app.mockResolvedValue(mockAppData);

    const result = await searchAppById(packageId);

    expect(gplay.default.app).toHaveBeenCalledWith({
      appId: packageId,
      lang: 'ja',
      country: 'jp',
    });
    expect(result).toEqual({
      playStoreUrl: mockAppData.url,
      version: mockAppData.version,
      packageId: mockAppData.appId,
    });
  });

  it('should return null when API throws error', async () => {
    const packageId = 'invalid.package.id';

    const gplay = await import('google-play-scraper');
    gplay.default.app.mockRejectedValue(new Error('App not found (404)'));

    const result = await searchAppById(packageId);

    expect(result).toBeNull();
  });

  it('should return null for empty package ID', async () => {
    const result = await searchAppById('');

    expect(result).toBeNull();
  });
});
