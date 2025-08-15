/**
 * Tests for GitHub milestone information utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getMilestones,
  getCurrentMilestone,
  calculateProgress,
} from '../../scripts/lib/milestones.js';

// Mock the github-cli module
vi.mock('../../scripts/lib/github-cli.js', () => ({
  executeGH: vi.fn(),
  ghAPI: vi.fn(),
}));

import { ghAPI } from '../../scripts/lib/github-cli.js';

describe('Milestone Information Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Function exports', () => {
    it('should export required functions', () => {
      expect(typeof getMilestones).toBe('function');
      expect(typeof getCurrentMilestone).toBe('function');
      expect(typeof calculateProgress).toBe('function');
    });
  });

  describe('calculateProgress', () => {
    it('should calculate progress correctly', () => {
      expect(calculateProgress(5, 15)).toBe(75);
      expect(calculateProgress(10, 10)).toBe(50);
      expect(calculateProgress(0, 20)).toBe(100);
      expect(calculateProgress(20, 0)).toBe(0);
    });

    it('should handle zero total issues', () => {
      expect(calculateProgress(0, 0)).toBe(0);
    });

    it('should round progress to nearest integer', () => {
      expect(calculateProgress(1, 2)).toBe(67); // 66.666... rounds to 67
      expect(calculateProgress(2, 1)).toBe(33); // 33.333... rounds to 33
    });
  });

  describe('getMilestones', () => {
    it('should return open milestones only', async () => {
      const mockAPIResponse = [
        {
          id: 1,
          title: 'v1.0.0',
          state: 'open',
          open_issues: 5,
          closed_issues: 10,
        },
        {
          id: 2,
          title: 'v1.1.0',
          state: 'closed',
          open_issues: 0,
          closed_issues: 8,
        },
        {
          id: 3,
          title: 'v2.0.0',
          state: 'open',
          open_issues: 3,
          closed_issues: 2,
        },
      ];

      ghAPI.mockResolvedValue(mockAPIResponse);

      const result = await getMilestones('test', 'repo');

      expect(ghAPI).toHaveBeenCalledWith('repos/test/repo/milestones');
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('v1.0.0');
      expect(result[1].title).toBe('v2.0.0');
    });

    it('should return empty array when no milestones found', async () => {
      ghAPI.mockRejectedValue(new Error('No milestones found'));

      const result = await getMilestones('test', 'repo');

      expect(result).toEqual([]);
    });

    it('should return empty array when all milestones are closed', async () => {
      const mockAPIResponse = [
        {
          id: 1,
          title: 'v1.0.0',
          state: 'closed',
          open_issues: 0,
          closed_issues: 10,
        },
      ];

      ghAPI.mockResolvedValue(mockAPIResponse);

      const result = await getMilestones('test', 'repo');

      expect(result).toEqual([]);
    });
  });

  describe('getCurrentMilestone', () => {
    it('should return the milestone with lowest semantic version', async () => {
      const mockAPIResponse = [
        {
          id: 1,
          title: 'v2.1.0 - Spring Update',
          state: 'open',
          open_issues: 3,
          closed_issues: 7,
          due_on: '2025-03-01T00:00:00Z',
          html_url: 'https://github.com/test/repo/milestone/1',
        },
        {
          id: 2,
          title: 'v1.5.0 - Bug fixes',
          state: 'open',
          open_issues: 2,
          closed_issues: 8,
          due_on: null,
          html_url: 'https://github.com/test/repo/milestone/2',
        },
        {
          id: 3,
          title: 'v2.0.0 - Major release',
          state: 'open',
          open_issues: 5,
          closed_issues: 15,
          due_on: '2025-02-15T00:00:00Z',
          html_url: 'https://github.com/test/repo/milestone/3',
        },
      ];

      ghAPI.mockResolvedValue(mockAPIResponse);

      const result = await getCurrentMilestone('test', 'repo');

      expect(result).toEqual({
        title: 'v1.5.0 - Bug fixes',
        openIssues: 2,
        closedIssues: 8,
        totalIssues: 10,
        progress: 80,
        dueOn: null,
        url: 'https://github.com/test/repo/milestone/2',
      });
    });

    it('should handle milestones without version numbers', async () => {
      const mockAPIResponse = [
        {
          id: 1,
          title: 'Next Release',
          state: 'open',
          open_issues: 5,
          closed_issues: 5,
          due_on: null,
          html_url: 'https://github.com/test/repo/milestone/1',
        },
        {
          id: 2,
          title: 'v1.0.0',
          state: 'open',
          open_issues: 3,
          closed_issues: 12,
          due_on: null,
          html_url: 'https://github.com/test/repo/milestone/2',
        },
      ];

      ghAPI.mockResolvedValue(mockAPIResponse);

      const result = await getCurrentMilestone('test', 'repo');

      // Should pick the first one when sorting (v1.0.0 has version, so it comes first)
      expect(result.title).toBe('v1.0.0');
    });

    it('should return null when no milestones exist', async () => {
      ghAPI.mockResolvedValue([]);

      const result = await getCurrentMilestone('test', 'repo');

      expect(result).toBeNull();
    });

    it('should return null when API call fails', async () => {
      ghAPI.mockRejectedValue(new Error('API error'));

      const result = await getCurrentMilestone('test', 'repo');

      expect(result).toBeNull();
    });

    it('should format dates correctly', async () => {
      const mockAPIResponse = [
        {
          id: 1,
          title: 'v1.0.0',
          state: 'open',
          open_issues: 2,
          closed_issues: 3,
          due_on: '2025-12-31T23:59:59Z',
          html_url: 'https://github.com/test/repo/milestone/1',
        },
      ];

      ghAPI.mockResolvedValue(mockAPIResponse);

      const result = await getCurrentMilestone('test', 'repo');

      expect(result.dueOn).toBe('2025-12-31');
    });

    it('should handle missing issue counts', async () => {
      const mockAPIResponse = [
        {
          id: 1,
          title: 'v1.0.0',
          state: 'open',
          // Missing open_issues and closed_issues
          due_on: null,
          html_url: 'https://github.com/test/repo/milestone/1',
        },
      ];

      ghAPI.mockResolvedValue(mockAPIResponse);

      const result = await getCurrentMilestone('test', 'repo');

      expect(result).toEqual({
        title: 'v1.0.0',
        openIssues: 0,
        closedIssues: 0,
        totalIssues: 0,
        progress: 0,
        dueOn: null,
        url: 'https://github.com/test/repo/milestone/1',
      });
    });
  });

  describe('Semantic version comparison', () => {
    it('should correctly order versions', async () => {
      const mockAPIResponse = [
        {
          id: 1,
          title: 'v2.0.0',
          state: 'open',
          open_issues: 1,
          closed_issues: 1,
          html_url: 'https://github.com/test/repo/milestone/1',
        },
        {
          id: 2,
          title: 'v1.2.0',
          state: 'open',
          open_issues: 1,
          closed_issues: 1,
          html_url: 'https://github.com/test/repo/milestone/2',
        },
        {
          id: 3,
          title: 'v1.10.0',
          state: 'open',
          open_issues: 1,
          closed_issues: 1,
          html_url: 'https://github.com/test/repo/milestone/3',
        },
        {
          id: 4,
          title: 'v1.2.5',
          state: 'open',
          open_issues: 1,
          closed_issues: 1,
          html_url: 'https://github.com/test/repo/milestone/4',
        },
      ];

      ghAPI.mockResolvedValue(mockAPIResponse);

      const result = await getCurrentMilestone('test', 'repo');

      // Should return v1.2.0 as it's the lowest version
      expect(result.title).toBe('v1.2.0');
    });
  });
});
