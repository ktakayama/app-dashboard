/**
 * Tests for GitHub pull request information utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getRecentPullRequests,
  getPullRequestDetails,
  normalizePRState,
} from '../../scripts/lib/pull-requests.js';

// Mock the github-cli module
vi.mock('../../scripts/lib/github-cli.js', () => ({
  executeGH: vi.fn(),
}));

import { executeGH } from '../../scripts/lib/github-cli.js';

describe('Pull Request Information Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Function exports', () => {
    it('should export required functions', () => {
      expect(typeof getRecentPullRequests).toBe('function');
      expect(typeof getPullRequestDetails).toBe('function');
      expect(typeof normalizePRState).toBe('function');
    });
  });

  describe('normalizePRState', () => {
    it('should normalize PR data correctly', () => {
      const mockPR = {
        number: 123,
        title: 'Add new feature',
        url: 'https://github.com/owner/repo/pull/123',
        state: 'merged',
        mergedAt: '2025-01-15T10:30:00Z',
        closedAt: null,
        updatedAt: '2025-01-15T10:30:00Z',
      };

      const result = normalizePRState(mockPR);

      expect(result).toEqual({
        number: 123,
        title: 'Add new feature',
        url: 'https://github.com/owner/repo/pull/123',
        state: 'merged',
        mergedAt: '2025-01-15T10:30:00Z',
      });
    });

    it('should handle PR without mergedAt', () => {
      const mockPR = {
        number: 456,
        title: 'Fix bug',
        url: 'https://github.com/owner/repo/pull/456',
        state: 'open',
        mergedAt: null,
        closedAt: null,
        updatedAt: '2025-01-14T15:20:00Z',
      };

      const result = normalizePRState(mockPR);

      expect(result).toEqual({
        number: 456,
        title: 'Fix bug',
        url: 'https://github.com/owner/repo/pull/456',
        state: 'open',
        mergedAt: null,
      });
    });
  });

  describe('getPullRequestDetails', () => {
    it('should return PR details when found', async () => {
      const mockPRDetails = {
        number: 789,
        title: 'Update documentation',
        url: 'https://github.com/test/repo/pull/789',
        state: 'MERGED',
        mergedAt: '2025-01-10T14:20:00Z',
        closedAt: '2025-01-10T14:20:00Z',
        updatedAt: '2025-01-10T14:20:00Z',
      };

      executeGH.mockResolvedValue(JSON.stringify(mockPRDetails));

      const result = await getPullRequestDetails('test', 'repo', 789);

      expect(executeGH).toHaveBeenCalledWith([
        'pr',
        'view',
        '789',
        '--repo',
        'test/repo',
        '--json',
        'number,title,url,state,mergedAt,closedAt,updatedAt',
      ]);

      expect(result).toEqual(mockPRDetails);
    });

    it('should return null when PR not found', async () => {
      executeGH.mockRejectedValue(new Error('PR not found'));

      const result = await getPullRequestDetails('test', 'repo', 999);

      expect(result).toBeNull();
    });
  });

  describe('getRecentPullRequests', () => {
    it('should return empty array when API calls fail', async () => {
      executeGH.mockRejectedValue(new Error('API error'));

      const result = await getRecentPullRequests('test', 'repo');

      expect(result).toEqual([]);
    });

    it('should respect the limit parameter', async () => {
      const mockPRs = Array.from({ length: 5 }, (_, i) => ({
        number: i + 1,
        title: `PR ${i + 1}`,
        url: `https://github.com/test/repo/pull/${i + 1}`,
        state: 'merged',
        mergedAt: `2025-01-${10 + i}T10:00:00Z`,
        closedAt: `2025-01-${10 + i}T10:00:00Z`,
        updatedAt: `2025-01-${10 + i}T10:00:00Z`,
      }));

      executeGH
        .mockResolvedValueOnce(JSON.stringify([]))
        .mockResolvedValueOnce(JSON.stringify(mockPRs))
        .mockResolvedValueOnce(JSON.stringify([]));

      const result = await getRecentPullRequests('test', 'repo', 2);

      expect(result).toHaveLength(2);
      // Should return the 2 most recent (highest numbers due to date sorting)
      expect(result[0].number).toBe(5);
      expect(result[1].number).toBe(4);
    });
  });
});
