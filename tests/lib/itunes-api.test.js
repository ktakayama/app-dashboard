/**
 * Unit tests for iTunes Search API module
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchAppByBundleId, searchAppByName, formatAppStoreInfo } from '../../scripts/lib/itunes-api.js';

// Mock fetch for testing
global.fetch = vi.fn();

describe('iTunes Search API Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchAppByBundleId', () => {
    it('should export searchAppByBundleId function', () => {
      expect(typeof searchAppByBundleId).toBe('function');
    });

    it('should return null for invalid bundle ID input', async () => {
      expect(await searchAppByBundleId('')).toBe(null);
      expect(await searchAppByBundleId(null)).toBe(null);
      expect(await searchAppByBundleId(undefined)).toBe(null);
      expect(await searchAppByBundleId(123)).toBe(null);
    });

    it('should return null when app is not found', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [] })
      });

      const result = await searchAppByBundleId('com.nonexistent.app');
      expect(result).toBe(null);
    });

    it('should return null when bundle ID does not match exactly', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          results: [{
            bundleId: 'com.different.app',
            trackViewUrl: 'https://apps.apple.com/app/id123',
            version: '1.0.0',
            artworkUrl512: 'https://example.com/icon.png'
          }]
        })
      });

      const result = await searchAppByBundleId('com.test.app');
      expect(result).toBe(null);
    });

    it('should return formatted app info for valid bundle ID', async () => {
      const mockAppData = {
        bundleId: 'com.test.app',
        trackViewUrl: 'https://apps.apple.com/app/id123',
        version: '1.0.0',
        artworkUrl512: 'https://example.com/icon512.png'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [mockAppData] })
      });

      const result = await searchAppByBundleId('com.test.app');
      expect(result).toEqual({
        appStoreUrl: 'https://apps.apple.com/app/id123',
        version: '1.0.0',
        iconUrl: 'https://example.com/icon512.png'
      });
    });
  });

  describe('searchAppByName', () => {
    it('should export searchAppByName function', () => {
      expect(typeof searchAppByName).toBe('function');
    });

    it('should return null for invalid app name input', async () => {
      expect(await searchAppByName('')).toBe(null);
      expect(await searchAppByName(null)).toBe(null);
      expect(await searchAppByName(undefined)).toBe(null);
      expect(await searchAppByName(123)).toBe(null);
    });

    it('should return null when no apps are found', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [] })
      });

      const result = await searchAppByName('Nonexistent App');
      expect(result).toBe(null);
    });

    it('should return first result when no exact match found', async () => {
      const mockAppData = {
        trackName: 'Similar App',
        artistName: 'Test Developer',
        trackViewUrl: 'https://apps.apple.com/app/id456',
        version: '2.0.0',
        artworkUrl100: 'https://example.com/icon100.png'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [mockAppData] })
      });

      const result = await searchAppByName('Test App');
      expect(result).toEqual({
        appStoreUrl: 'https://apps.apple.com/app/id456',
        version: '2.0.0',
        iconUrl: 'https://example.com/icon512.png'
      });
    });

    it('should prioritize exact app name match', async () => {
      const mockApps = [
        {
          trackName: 'Different App',
          artistName: 'Test Developer',
          trackViewUrl: 'https://apps.apple.com/app/id456',
          version: '1.0.0',
          artworkUrl100: 'https://example.com/icon1.png'
        },
        {
          trackName: 'Test App',
          artistName: 'Another Developer',
          trackViewUrl: 'https://apps.apple.com/app/id789',
          version: '2.0.0',
          artworkUrl512: 'https://example.com/icon2.png'
        }
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: mockApps })
      });

      const result = await searchAppByName('Test App');
      expect(result).toEqual({
        appStoreUrl: 'https://apps.apple.com/app/id789',
        version: '2.0.0',
        iconUrl: 'https://example.com/icon2.png'
      });
    });
  });

  describe('formatAppStoreInfo', () => {
    it('should export formatAppStoreInfo function', () => {
      expect(typeof formatAppStoreInfo).toBe('function');
    });

    it('should return null values for invalid input', () => {
      expect(formatAppStoreInfo(null)).toEqual({
        appStoreUrl: null,
        version: null,
        iconUrl: null
      });

      expect(formatAppStoreInfo(undefined)).toEqual({
        appStoreUrl: null,
        version: null,
        iconUrl: null
      });

      expect(formatAppStoreInfo({})).toEqual({
        appStoreUrl: null,
        version: null,
        iconUrl: null
      });
    });

    it('should extract app store URL and version', () => {
      const mockData = {
        trackViewUrl: 'https://apps.apple.com/app/id123',
        version: '1.5.0'
      };

      const result = formatAppStoreInfo(mockData);
      expect(result.appStoreUrl).toBe('https://apps.apple.com/app/id123');
      expect(result.version).toBe('1.5.0');
    });

    it('should prioritize artworkUrl512 for icon', () => {
      const mockData = {
        artworkUrl512: 'https://example.com/icon512.png',
        artworkUrl100: 'https://example.com/icon100.png',
        artworkUrl60: 'https://example.com/icon60.png'
      };

      const result = formatAppStoreInfo(mockData);
      expect(result.iconUrl).toBe('https://example.com/icon512.png');
    });

    it('should use artworkUrl100 and convert to 512x512 when artworkUrl512 not available', () => {
      const mockData = {
        artworkUrl100: 'https://example.com/image/100x100bb.png'
      };

      const result = formatAppStoreInfo(mockData);
      expect(result.iconUrl).toBe('https://example.com/image/512x512bb.png');
    });

    it('should use artworkUrl60 and convert to 512x512 when higher res not available', () => {
      const mockData = {
        artworkUrl60: 'https://example.com/image/60x60bb.png'
      };

      const result = formatAppStoreInfo(mockData);
      expect(result.iconUrl).toBe('https://example.com/image/512x512bb.png');
    });
  });
});