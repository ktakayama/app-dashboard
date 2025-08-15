/**
 * Tests for repository information retrieval utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRepositoryInfo, getAppName } from '../../scripts/lib/repository.js';

vi.mock('../../scripts/lib/github-cli.js', () => ({
  ghAPI: vi.fn(),
}));

import { ghAPI } from '../../scripts/lib/github-cli.js';

describe('Repository Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRepositoryInfo', () => {
    it('should return repository information', async () => {
      const mockRepoData = {
        name: 'test-repo',
        full_name: 'owner/test-repo',
        description: 'Test repository',
        default_branch: 'main',
        language: 'JavaScript',
        topics: ['test', 'example'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        html_url: 'https://github.com/owner/test-repo',
        owner: { login: 'owner' },
        private: false,
      };

      ghAPI.mockResolvedValue(mockRepoData);

      const result = await getRepositoryInfo('owner', 'test-repo');

      expect(ghAPI).toHaveBeenCalledWith('repos/owner/test-repo');
      expect(result).toEqual({
        name: 'test-repo',
        fullName: 'owner/test-repo',
        description: 'Test repository',
        defaultBranch: 'main',
        language: 'JavaScript',
        topics: ['test', 'example'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        url: 'https://github.com/owner/test-repo',
        owner: 'owner',
        private: false,
      });
    });

    it('should handle missing optional fields', async () => {
      const mockRepoData = {
        name: 'test-repo',
        full_name: 'owner/test-repo',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        html_url: 'https://github.com/owner/test-repo',
        owner: { login: 'owner' },
      };

      ghAPI.mockResolvedValue(mockRepoData);

      const result = await getRepositoryInfo('owner', 'test-repo');

      expect(result.description).toBe('');
      expect(result.defaultBranch).toBe('main');
      expect(result.language).toBeNull();
      expect(result.topics).toEqual([]);
      expect(result.private).toBe(false);
    });

    it('should throw error for missing parameters', async () => {
      await expect(getRepositoryInfo('', 'repo')).rejects.toThrow(
        'Repository owner and name are required'
      );
      await expect(getRepositoryInfo('owner', '')).rejects.toThrow(
        'Repository owner and name are required'
      );
    });

    it('should throw error for invalid repository data', async () => {
      ghAPI.mockResolvedValue({});

      await expect(getRepositoryInfo('owner', 'test-repo')).rejects.toThrow(
        'Invalid repository data for owner/test-repo'
      );
    });

    it('should handle GitHub API errors', async () => {
      ghAPI.mockRejectedValue(new Error('gh command failed: not found'));

      await expect(getRepositoryInfo('owner', 'test-repo')).rejects.toThrow(
        'Failed to access repository owner/test-repo'
      );
    });
  });

  describe('getAppName', () => {
    it('should extract app name from package.json', async () => {
      const mockPackageJson = {
        content: Buffer.from(
          JSON.stringify({ displayName: 'My App' })
        ).toString('base64'),
      };

      ghAPI.mockResolvedValueOnce(mockPackageJson);

      const result = await getAppName('owner', 'test-repo', 'fallback');

      expect(ghAPI).toHaveBeenCalledWith('repos/owner/test-repo/contents/package.json');
      expect(result).toBe('My App');
    });

    it('should extract app name from pubspec.yaml', async () => {
      const mockPubspec = {
        content: Buffer.from('name: flutter_app\nversion: 1.0.0').toString('base64'),
      };

      ghAPI.mockRejectedValueOnce(new Error('Not found'));
      ghAPI.mockResolvedValueOnce(mockPubspec);

      const result = await getAppName('owner', 'test-repo', 'fallback');

      expect(result).toBe('flutter_app');
    });

    it('should extract app name from app.json', async () => {
      const mockAppJson = {
        content: Buffer.from(
          JSON.stringify({ expo: { name: 'Expo App' } })
        ).toString('base64'),
      };

      ghAPI.mockRejectedValueOnce(new Error('Not found'));
      ghAPI.mockRejectedValueOnce(new Error('Not found'));
      ghAPI.mockResolvedValueOnce(mockAppJson);

      const result = await getAppName('owner', 'test-repo', 'fallback');

      expect(result).toBe('Expo App');
    });

    it('should use fallback name when no app name is found', async () => {
      ghAPI.mockRejectedValue(new Error('Not found'));

      const result = await getAppName('owner', 'test-repo', 'fallback');

      expect(result).toBe('fallback');
    });

    it('should use repo name when no fallback is provided', async () => {
      ghAPI.mockRejectedValue(new Error('Not found'));

      const result = await getAppName('owner', 'test-repo');

      expect(result).toBe('test-repo');
    });

    it('should handle missing parameters', async () => {
      const result = await getAppName('', 'repo', 'fallback');
      expect(result).toBe('fallback');

      const result2 = await getAppName('owner', '');
      expect(result2).toBe('unknown');
    });
  });
});