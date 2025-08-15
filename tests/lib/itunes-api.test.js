/**
 * Unit tests for iTunes Lookup API module
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  searchAppById,
  formatAppStoreInfo,
} from '../../scripts/lib/itunes-api.js';

// Mock fetch for testing
global.fetch = vi.fn();

describe('iTunes Lookup API Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchAppById', () => {
    it('should export searchAppById function', () => {
      expect(typeof searchAppById).toBe('function');
    });

    it('should return null for invalid app ID input', async () => {
      expect(await searchAppById('')).toBe(null);
      expect(await searchAppById(null)).toBe(null);
      expect(await searchAppById(undefined)).toBe(null);
    });

    it('should return null when app is not found', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      });

      const result = await searchAppById('9999999999');
      expect(result).toBe(null);
    });

    it('should return formatted app info for valid app ID', async () => {
      const mockAppData = {
        trackId: 6446930619,
        trackViewUrl: 'https://apps.apple.com/app/id6446930619',
        version: '1.13.1',
        artworkUrl512: 'https://example.com/icon512.png',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [mockAppData] }),
      });

      const result = await searchAppById('6446930619');
      expect(result).toEqual({
        appStoreUrl: 'https://apps.apple.com/app/id6446930619',
        version: '1.13.1',
        iconUrl: 'https://example.com/icon512.png',
        minimumOsVersion: null,
      });
    });

    it('should handle numeric app ID input', async () => {
      const mockAppData = {
        trackId: 6446930619,
        trackViewUrl: 'https://apps.apple.com/app/id6446930619',
        version: '1.13.1',
        artworkUrl512: 'https://example.com/icon512.png',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [mockAppData] }),
      });

      const result = await searchAppById(6446930619);
      expect(result).toEqual({
        appStoreUrl: 'https://apps.apple.com/app/id6446930619',
        version: '1.13.1',
        iconUrl: 'https://example.com/icon512.png',
        minimumOsVersion: null,
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
        iconUrl: null,
        minimumOsVersion: null,
      });

      expect(formatAppStoreInfo(undefined)).toEqual({
        appStoreUrl: null,
        version: null,
        iconUrl: null,
        minimumOsVersion: null,
      });

      expect(formatAppStoreInfo({})).toEqual({
        appStoreUrl: null,
        version: null,
        iconUrl: null,
        minimumOsVersion: null,
      });
    });

    it('should extract app store URL, version and minimumOsVersion', () => {
      const mockData = {
        trackViewUrl: 'https://apps.apple.com/app/id123',
        version: '1.5.0',
        minimumOsVersion: '16.4',
      };

      const result = formatAppStoreInfo(mockData);
      expect(result.appStoreUrl).toBe('https://apps.apple.com/app/id123');
      expect(result.version).toBe('1.5.0');
      expect(result.minimumOsVersion).toBe('16.4');
    });

    it('should prioritize artworkUrl512 for icon', () => {
      const mockData = {
        artworkUrl512: 'https://example.com/icon512.png',
        artworkUrl100: 'https://example.com/icon100.png',
        artworkUrl60: 'https://example.com/icon60.png',
      };

      const result = formatAppStoreInfo(mockData);
      expect(result.iconUrl).toBe('https://example.com/icon512.png');
    });

    it('should use artworkUrl100 and convert to 512x512 when artworkUrl512 not available', () => {
      const mockData = {
        artworkUrl100: 'https://example.com/image/100x100bb.png',
      };

      const result = formatAppStoreInfo(mockData);
      expect(result.iconUrl).toBe('https://example.com/image/512x512bb.png');
    });

    it('should use artworkUrl60 and convert to 512x512 when higher res not available', () => {
      const mockData = {
        artworkUrl60: 'https://example.com/image/60x60bb.png',
      };

      const result = formatAppStoreInfo(mockData);
      expect(result.iconUrl).toBe('https://example.com/image/512x512bb.png');
    });
  });
});
