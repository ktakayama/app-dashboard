/**
 * Tests for GitHub release information utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getLatestRelease,
  getReleases,
  getLatestTag,
  formatReleaseData,
  formatTagData,
} from '../../scripts/lib/releases.js';

// Mock the github-cli module
vi.mock('../../scripts/lib/github-cli.js', () => ({
  executeGH: vi.fn(),
  ghAPI: vi.fn(),
}));

import { ghAPI } from '../../scripts/lib/github-cli.js';

describe('Release Information Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Function exports', () => {
    it('should export required functions', () => {
      expect(typeof getLatestRelease).toBe('function');
      expect(typeof getReleases).toBe('function');
      expect(typeof getLatestTag).toBe('function');
      expect(typeof formatReleaseData).toBe('function');
      expect(typeof formatTagData).toBe('function');
    });
  });

  describe('formatReleaseData', () => {
    it('should format release data correctly', () => {
      const mockReleaseData = {
        tagName: 'v1.2.3',
        publishedAt: '2025-01-15T10:30:00Z',
        url: 'https://github.com/owner/repo/releases/tag/v1.2.3',
      };

      const result = formatReleaseData(mockReleaseData);

      expect(result).toEqual({
        version: 'v1.2.3',
        date: '2025-01-15',
        url: 'https://github.com/owner/repo/releases/tag/v1.2.3',
      });
    });

    it('should handle null publishedAt', () => {
      const mockReleaseData = {
        tagName: 'v1.0.0',
        publishedAt: null,
        url: 'https://github.com/owner/repo/releases/tag/v1.0.0',
      };

      const result = formatReleaseData(mockReleaseData);

      expect(result).toEqual({
        version: 'v1.0.0',
        date: null,
        url: 'https://github.com/owner/repo/releases/tag/v1.0.0',
      });
    });
  });

  describe('formatTagData', () => {
    it('should format tag data correctly', () => {
      const mockTagData = {
        name: 'v2.0.0',
      };

      const result = formatTagData(mockTagData, 'owner', 'repo');

      expect(result).toEqual({
        version: 'v2.0.0',
        date: null,
        url: 'https://github.com/owner/repo/releases/tag/v2.0.0',
      });
    });
  });

  describe('getLatestRelease', () => {
    it('should return formatted release data for stable release', async () => {
      const mockAPIResponse = {
        tag_name: 'v1.5.0',
        published_at: '2025-01-10T14:20:00Z',
        html_url: 'https://github.com/test/repo/releases/tag/v1.5.0',
        prerelease: false,
      };

      ghAPI.mockResolvedValue(mockAPIResponse);

      const result = await getLatestRelease('test', 'repo');

      expect(ghAPI).toHaveBeenCalledWith('repos/test/repo/releases/latest');

      expect(result).toEqual({
        version: 'v1.5.0',
        date: '2025-01-10',
        url: 'https://github.com/test/repo/releases/tag/v1.5.0',
      });
    });

    it('should return null for prerelease', async () => {
      const mockAPIResponse = {
        tag_name: 'v2.0.0-beta.1',
        published_at: '2025-01-12T09:15:00Z',
        html_url: 'https://github.com/test/repo/releases/tag/v2.0.0-beta.1',
        prerelease: true,
      };

      ghAPI.mockResolvedValue(mockAPIResponse);

      const result = await getLatestRelease('test', 'repo');

      expect(result).toBeNull();
    });

    it('should return null when no releases found', async () => {
      ghAPI.mockRejectedValue(new Error('No releases found'));

      const result = await getLatestRelease('test', 'repo');

      expect(result).toBeNull();
    });
  });

  describe('getReleases', () => {
    it('should return formatted release list excluding prereleases', async () => {
      const mockAPIResponse = [
        {
          tag_name: 'v1.3.0',
          published_at: '2025-01-08T11:45:00Z',
          html_url: 'https://github.com/test/repo/releases/tag/v1.3.0',
          prerelease: false,
        },
        {
          tag_name: 'v1.3.0-rc.1',
          published_at: '2025-01-05T16:30:00Z',
          html_url: 'https://github.com/test/repo/releases/tag/v1.3.0-rc.1',
          prerelease: true,
        },
        {
          tag_name: 'v1.2.0',
          published_at: '2024-12-20T08:00:00Z',
          html_url: 'https://github.com/test/repo/releases/tag/v1.2.0',
          prerelease: false,
        },
      ];

      ghAPI.mockResolvedValue(mockAPIResponse);

      const result = await getReleases('test', 'repo', 3);

      expect(ghAPI).toHaveBeenCalledWith('repos/test/repo/releases?per_page=3');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        version: 'v1.3.0',
        date: '2025-01-08',
        url: 'https://github.com/test/repo/releases/tag/v1.3.0',
      });
      expect(result[1]).toEqual({
        version: 'v1.2.0',
        date: '2024-12-20',
        url: 'https://github.com/test/repo/releases/tag/v1.2.0',
      });
    });

    it('should return empty array when no releases found', async () => {
      ghAPI.mockRejectedValue(new Error('No releases found'));

      const result = await getReleases('test', 'repo');

      expect(result).toEqual([]);
    });
  });

  describe('getLatestTag', () => {
    it('should return formatted tag data', async () => {
      const mockTagsData = [
        {
          name: 'v1.4.0',
          commit: { sha: 'abc123' },
        },
        {
          name: 'v1.3.0',
          commit: { sha: 'def456' },
        },
      ];

      ghAPI.mockResolvedValue(mockTagsData);

      const result = await getLatestTag('test', 'repo');

      expect(ghAPI).toHaveBeenCalledWith('repos/test/repo/tags');

      expect(result).toEqual({
        version: 'v1.4.0',
        date: null,
        url: 'https://github.com/test/repo/releases/tag/v1.4.0',
      });
    });

    it('should return null when no tags found', async () => {
      ghAPI.mockResolvedValue([]);

      const result = await getLatestTag('test', 'repo');

      expect(result).toBeNull();
    });

    it('should return null when API call fails', async () => {
      ghAPI.mockRejectedValue(new Error('API error'));

      const result = await getLatestTag('test', 'repo');

      expect(result).toBeNull();
    });
  });
});
