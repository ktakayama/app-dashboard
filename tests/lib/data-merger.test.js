/**
 * Tests for data merger utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mergeAppData } from '../../scripts/lib/data-merger.js';

vi.mock('../../scripts/lib/repository.js', () => ({
  getRepositoryInfo: vi.fn(),
}));

vi.mock('../../scripts/lib/releases.js', () => ({
  getLatestRelease: vi.fn(),
}));

vi.mock('../../scripts/lib/milestones.js', () => ({
  getMilestone: vi.fn(),
}));

vi.mock('../../scripts/lib/pull-requests.js', () => ({
  getRecentPRs: vi.fn(),
}));

vi.mock('../../scripts/lib/itunes-api.js', () => ({
  searchAppById: vi.fn(),
}));

vi.mock('../../scripts/lib/play-store.js', () => ({
  getPlayStoreInfo: vi.fn(),
}));

import { getRepositoryInfo } from '../../scripts/lib/repository.js';
import { getLatestRelease } from '../../scripts/lib/releases.js';
import { getMilestone } from '../../scripts/lib/milestones.js';
import { getRecentPRs } from '../../scripts/lib/pull-requests.js';
import { searchAppById } from '../../scripts/lib/itunes-api.js';
import { getPlayStoreInfo } from '../../scripts/lib/play-store.js';

describe('Data Merger Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock current time for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T10:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockRepoConfig = {
    id: 'test-app',
    name: 'Test App',
    repository: 'owner/test-repo',
    platform: 'ios',
    appStoreId: '123456789',
    playStoreId: 'com.example.testapp',
  };

  const mockRepositoryData = {
    name: 'test-repo',
    fullName: 'owner/test-repo',
    description: 'Test repository',
    url: 'https://github.com/owner/test-repo',
    owner: 'owner',
    topics: ['test'],
    language: 'Swift',
  };

  const mockReleaseData = {
    version: 'v1.0.0',
    date: '2025-01-10',
    url: 'https://github.com/owner/test-repo/releases/tag/v1.0.0',
  };

  const mockMilestoneData = {
    title: 'v1.1.0 - Next Release',
    openIssues: 5,
    closedIssues: 10,
    totalIssues: 15,
    progress: 67,
  };

  const mockPRData = [
    {
      number: 42,
      title: 'Add new feature',
      url: 'https://github.com/owner/test-repo/pull/42',
      state: 'open',
    },
    {
      number: 41,
      title: 'Fix bug',
      url: 'https://github.com/owner/test-repo/pull/41',
      state: 'merged',
      mergedAt: '2025-01-09T15:30:00Z',
    },
  ];

  const mockItunesData = {
    appStoreUrl: 'https://apps.apple.com/app/id123456789',
    version: '1.0.0',
    iconUrl: 'https://example.com/icon-512.png',
    minimumOsVersion: '14.0',
  };

  const mockPlayStoreData = {
    playStoreUrl:
      'https://play.google.com/store/apps/details?id=com.example.testapp',
    version: '1.0.0',
    iconUrl: 'https://example.com/play-icon.png',
    minimumSdkVersion: '21',
  };

  describe('mergeAppData', () => {
    it('should merge all API data successfully', async () => {
      getRepositoryInfo.mockResolvedValue(mockRepositoryData);
      getLatestRelease.mockResolvedValue(mockReleaseData);
      getMilestone.mockResolvedValue(mockMilestoneData);
      getRecentPRs.mockResolvedValue(mockPRData);
      searchAppById.mockResolvedValue(mockItunesData);
      getPlayStoreInfo.mockResolvedValue(mockPlayStoreData);

      const result = await mergeAppData(mockRepoConfig);

      expect(result).toEqual({
        id: 'test-app',
        name: 'Test App',
        repository: 'owner/test-repo',
        platform: 'both',
        icon: 'https://example.com/icon-512.png',
        links: {
          github: 'https://github.com/owner/test-repo',
          appStore: 'https://apps.apple.com/app/id123456789',
          playStore:
            'https://play.google.com/store/apps/details?id=com.example.testapp',
        },
        latestRelease: {
          version: 'v1.0.0',
          date: '2025-01-10',
          url: 'https://github.com/owner/test-repo/releases/tag/v1.0.0',
        },
        storeVersions: {
          appStore: '1.0.0',
          playStore: '1.0.0',
        },
        milestone: {
          title: 'v1.1.0 - Next Release',
          openIssues: 5,
          closedIssues: 10,
          totalIssues: 15,
          progress: 67,
        },
        recentPRs: [
          {
            number: 42,
            title: 'Add new feature',
            url: 'https://github.com/owner/test-repo/pull/42',
            state: 'open',
          },
          {
            number: 41,
            title: 'Fix bug',
            url: 'https://github.com/owner/test-repo/pull/41',
            state: 'merged',
            mergedAt: '2025-01-09T15:30:00.000Z',
          },
        ],
        lastUpdated: '2025-01-15T10:30:00.000Z',
      });
    });

    it('should handle missing optional data gracefully', async () => {
      getRepositoryInfo.mockResolvedValue(mockRepositoryData);
      getLatestRelease.mockResolvedValue(null);
      getMilestone.mockResolvedValue(null);
      getRecentPRs.mockResolvedValue([]);
      searchAppById.mockResolvedValue(null);
      getPlayStoreInfo.mockResolvedValue(null);

      const minimalConfig = {
        repository: 'owner/test-repo',
      };

      const result = await mergeAppData(minimalConfig);

      expect(result).toEqual({
        id: 'test-repo',
        name: 'test-repo',
        repository: 'owner/test-repo',
        platform: 'both',
        icon: 'https://via.placeholder.com/60',
        links: {
          github: 'https://github.com/owner/test-repo',
        },
        latestRelease: null,
        storeVersions: {},
        milestone: null,
        recentPRs: [],
        lastUpdated: '2025-01-15T10:30:00.000Z',
      });
    });

    it('should determine platform correctly for iOS only', async () => {
      getRepositoryInfo.mockResolvedValue(mockRepositoryData);
      getLatestRelease.mockResolvedValue(null);
      getMilestone.mockResolvedValue(null);
      getRecentPRs.mockResolvedValue([]);
      searchAppById.mockResolvedValue(mockItunesData);
      getPlayStoreInfo.mockResolvedValue(null);

      const iosConfig = {
        repository: 'owner/test-repo',
        appStoreId: '123456789',
      };

      const result = await mergeAppData(iosConfig);

      expect(result.platform).toBe('ios');
      expect(result.links).toEqual({
        github: 'https://github.com/owner/test-repo',
        appStore: 'https://apps.apple.com/app/id123456789',
      });
      expect(result.storeVersions).toEqual({
        appStore: '1.0.0',
      });
    });

    it('should determine platform correctly for Android only', async () => {
      getRepositoryInfo.mockResolvedValue(mockRepositoryData);
      getLatestRelease.mockResolvedValue(null);
      getMilestone.mockResolvedValue(null);
      getRecentPRs.mockResolvedValue([]);
      searchAppById.mockResolvedValue(null);
      getPlayStoreInfo.mockResolvedValue(mockPlayStoreData);

      const androidConfig = {
        repository: 'owner/test-repo',
        playStoreId: 'com.example.testapp',
      };

      const result = await mergeAppData(androidConfig);

      expect(result.platform).toBe('android');
      expect(result.links).toEqual({
        github: 'https://github.com/owner/test-repo',
        playStore:
          'https://play.google.com/store/apps/details?id=com.example.testapp',
      });
      expect(result.storeVersions).toEqual({
        playStore: '1.0.0',
      });
    });

    it('should use pre-fetched API results when provided', async () => {
      const preApiResults = {
        repository: mockRepositoryData,
        release: mockReleaseData,
        milestone: mockMilestoneData,
        prs: mockPRData,
        itunes: mockItunesData,
        playStore: mockPlayStoreData,
      };

      const result = await mergeAppData(mockRepoConfig, preApiResults);

      expect(getRepositoryInfo).not.toHaveBeenCalled();
      expect(getLatestRelease).not.toHaveBeenCalled();
      expect(getMilestone).not.toHaveBeenCalled();
      expect(getRecentPRs).not.toHaveBeenCalled();
      expect(searchAppById).not.toHaveBeenCalled();
      expect(getPlayStoreInfo).not.toHaveBeenCalled();

      expect(result.name).toBe('Test App');
      expect(result.repository).toBe('owner/test-repo');
    });

    it('should throw error for invalid repository configuration', async () => {
      await expect(mergeAppData(null)).rejects.toThrow(
        'Repository configuration with repository field is required'
      );

      await expect(mergeAppData({})).rejects.toThrow(
        'Repository configuration with repository field is required'
      );
    });

    it('should throw error for invalid repository format', async () => {
      const invalidConfig = { repository: 'invalid-format' };

      await expect(mergeAppData(invalidConfig)).rejects.toThrow(
        'Invalid repository format: invalid-format'
      );
    });

    it('should handle API fetch errors gracefully', async () => {
      getRepositoryInfo.mockRejectedValue(new Error('GitHub API error'));

      const config = { repository: 'owner/test-repo' };

      await expect(mergeAppData(config)).rejects.toThrow(
        'Data merge failed for owner/test-repo: GitHub API error'
      );
    });

    it('should normalize date formats correctly', async () => {
      const releaseWithIsoDate = {
        version: 'v1.0.0',
        date: '2025-01-10T14:30:00Z',
        url: 'https://github.com/owner/test-repo/releases/tag/v1.0.0',
      };

      getRepositoryInfo.mockResolvedValue(mockRepositoryData);
      getLatestRelease.mockResolvedValue(releaseWithIsoDate);
      getMilestone.mockResolvedValue(null);
      getRecentPRs.mockResolvedValue([]);
      searchAppById.mockResolvedValue(null);
      getPlayStoreInfo.mockResolvedValue(null);

      const result = await mergeAppData(mockRepoConfig);

      expect(result.latestRelease.date).toBe('2025-01-10');
    });

    it('should select best icon in priority order', async () => {
      getRepositoryInfo.mockResolvedValue(mockRepositoryData);
      getLatestRelease.mockResolvedValue(null);
      getMilestone.mockResolvedValue(null);
      getRecentPRs.mockResolvedValue([]);
      searchAppById.mockResolvedValue(mockItunesData);
      getPlayStoreInfo.mockResolvedValue(mockPlayStoreData);

      // Test config icon priority
      const configWithIcon = {
        ...mockRepoConfig,
        icon: 'https://custom.com/icon.png',
      };

      const result1 = await mergeAppData(configWithIcon);
      expect(result1.icon).toBe('https://custom.com/icon.png');

      // Test iTunes icon priority (when no config icon)
      const configWithoutIcon = { ...mockRepoConfig };
      delete configWithoutIcon.icon;

      const result2 = await mergeAppData(configWithoutIcon);
      expect(result2.icon).toBe('https://example.com/icon-512.png');
    });

    it('should handle empty PR data correctly', async () => {
      getRepositoryInfo.mockResolvedValue(mockRepositoryData);
      getLatestRelease.mockResolvedValue(null);
      getMilestone.mockResolvedValue(null);
      getRecentPRs.mockResolvedValue(null); // null instead of []
      searchAppById.mockResolvedValue(null);
      getPlayStoreInfo.mockResolvedValue(null);

      const result = await mergeAppData(mockRepoConfig);

      expect(result.recentPRs).toEqual([]);
    });

    it('should preserve PR mergedAt timestamp format', async () => {
      const prWithMergedAt = [
        {
          number: 41,
          title: 'Fix bug',
          url: 'https://github.com/owner/test-repo/pull/41',
          state: 'merged',
          mergedAt: '2025-01-09T15:30:00Z',
        },
      ];

      getRepositoryInfo.mockResolvedValue(mockRepositoryData);
      getLatestRelease.mockResolvedValue(null);
      getMilestone.mockResolvedValue(null);
      getRecentPRs.mockResolvedValue(prWithMergedAt);
      searchAppById.mockResolvedValue(null);
      getPlayStoreInfo.mockResolvedValue(null);

      const result = await mergeAppData(mockRepoConfig);

      expect(result.recentPRs[0].mergedAt).toBe('2025-01-09T15:30:00.000Z');
    });
  });
});
