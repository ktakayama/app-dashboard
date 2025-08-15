/**
 * Test for Play Store API integration
 */

import { describe, it, expect } from 'vitest';
import {
  searchAppById,
  formatPlayStoreInfo,
  getManualPlayStoreInfo,
} from '../../scripts/lib/play-store.js';

describe('Play Store API', () => {
  it('should format play store data correctly', () => {
    const mockData = {
      url: 'https://play.google.com/store/apps/details?id=com.example.app',
      version: '1.0.0',
      appId: 'com.example.app',
    };

    const result = formatPlayStoreInfo(mockData);

    expect(result).toEqual({
      playStoreUrl:
        'https://play.google.com/store/apps/details?id=com.example.app',
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

  it('should return manual play store info', () => {
    const packageId = 'com.example.app';
    const config = { manualVersion: '2.0.0' };

    const result = getManualPlayStoreInfo(packageId, config);

    expect(result).toEqual({
      playStoreUrl:
        'https://play.google.com/store/apps/details?id=com.example.app',
      version: '2.0.0',
      packageId: 'com.example.app',
    });
  });

  it('should search real app by package ID', async () => {
    // Test with the provided URL package ID
    const packageId = 'org.aill.tadoku_log';

    const result = await searchAppById(packageId);

    expect(result).toBeTruthy();
    expect(result.packageId).toBe(packageId);
    expect(result.version).toBeTruthy();
    expect(result.playStoreUrl).toContain('play.google.com');
  }, 10000); // 10 second timeout for API call

  it('should return null for invalid package ID', async () => {
    const result = await searchAppById(
      'invalid.package.id.that.does.not.exist'
    );

    expect(result).toBeNull();
  }, 10000);

  it('should return null for empty package ID', async () => {
    const result = await searchAppById('');

    expect(result).toBeNull();
  });
});
