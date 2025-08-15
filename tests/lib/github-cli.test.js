/**
 * Unit tests for GitHub CLI wrapper
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock child_process before importing the module
vi.mock('child_process', () => ({
  spawn: vi.fn(),
  execSync: vi.fn(),
}));

import { spawn } from 'child_process';
import {
  executeGH,
  ghAPI,
  ghRepo,
  GitHubAuthError,
  GitHubRateLimitError,
  GitHubNetworkError,
} from '../../scripts/lib/github-cli.js';

describe('GitHub CLI Wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeGH', () => {
    it('should execute gh command successfully', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
      };

      spawn.mockReturnValue(mockChild);

      // Setup successful execution
      mockChild.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback('test output');
        }
      });

      mockChild.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          callback(0); // Exit code 0 = success
        }
      });

      const promise = executeGH(['api', 'user']);

      // Wait for promise to resolve
      const result = await promise;

      expect(result).toBe('test output');
      expect(spawn).toHaveBeenCalledWith(
        'gh',
        ['api', 'user'],
        expect.any(Object)
      );
    });

    it('should handle authentication errors', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
      };

      spawn.mockReturnValue(mockChild);

      mockChild.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback('authentication required');
        }
      });

      mockChild.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          callback(4); // Exit code 4 = auth error
        }
      });

      await expect(executeGH(['api', 'user'])).rejects.toThrow(GitHubAuthError);
    });

    it('should handle rate limit errors', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
      };

      spawn.mockReturnValue(mockChild);

      mockChild.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback('API rate limit exceeded');
        }
      });

      mockChild.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          callback(1);
        }
      });

      await expect(executeGH(['api', 'user'])).rejects.toThrow(
        GitHubRateLimitError
      );
    });

    it('should handle network errors', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
      };

      spawn.mockReturnValue(mockChild);

      mockChild.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback('network connection failed');
        }
      });

      mockChild.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          callback(1);
        }
      });

      await expect(executeGH(['api', 'user'])).rejects.toThrow(
        GitHubNetworkError
      );
    });
  });

  describe('ghAPI', () => {
    it('should parse JSON response successfully', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
      };

      spawn.mockReturnValue(mockChild);

      const jsonResponse = { login: 'testuser', id: 123 };

      mockChild.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback(JSON.stringify(jsonResponse));
        }
      });

      mockChild.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          callback(0);
        }
      });

      const result = await ghAPI('user');

      expect(result).toEqual(jsonResponse);
      expect(spawn).toHaveBeenCalledWith(
        'gh',
        ['api', 'user'],
        expect.any(Object)
      );
    });

    it('should add method parameter when provided', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
      };

      spawn.mockReturnValue(mockChild);

      mockChild.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback('{}');
        }
      });

      mockChild.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          callback(0);
        }
      });

      await ghAPI('repos/owner/repo', { method: 'POST' });

      expect(spawn).toHaveBeenCalledWith(
        'gh',
        ['api', 'repos/owner/repo', '--method', 'POST'],
        expect.any(Object)
      );
    });
  });

  describe('ghRepo', () => {
    it('should execute repository commands with JSON output', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
      };

      spawn.mockReturnValue(mockChild);

      const jsonResponse = [{ tag_name: 'v1.0.0' }];

      mockChild.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback(JSON.stringify(jsonResponse));
        }
      });

      mockChild.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          callback(0);
        }
      });

      const result = await ghRepo('owner', 'repo', 'release');

      expect(result).toEqual(jsonResponse);
      expect(spawn).toHaveBeenCalledWith(
        'gh',
        ['release', '--repo', 'owner/repo', '--json'],
        expect.any(Object)
      );
    });

    it('should add limit and state options when provided', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
      };

      spawn.mockReturnValue(mockChild);

      mockChild.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback('[]');
        }
      });

      mockChild.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          callback(0);
        }
      });

      await ghRepo('owner', 'repo', 'pr', { limit: 10, state: 'open' });

      expect(spawn).toHaveBeenCalledWith(
        'gh',
        [
          'pr',
          '--repo',
          'owner/repo',
          '--json',
          '--limit',
          '10',
          '--state',
          'open',
        ],
        expect.any(Object)
      );
    });

    it('should return plain text for non-JSON responses', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
      };

      spawn.mockReturnValue(mockChild);

      const textResponse = 'Repository cloned successfully';

      mockChild.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback(textResponse);
        }
      });

      mockChild.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          callback(0);
        }
      });

      const result = await ghRepo('owner', 'repo', 'clone');

      expect(result).toBe(textResponse);
    });
  });
});
