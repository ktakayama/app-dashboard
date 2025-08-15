/**
 * Simple integration tests for GitHub CLI wrapper
 */

import { describe, it, expect } from 'vitest';
import {
  GitHubAuthError,
  GitHubRateLimitError,
  GitHubNetworkError,
} from '../../scripts/lib/github-cli.js';

describe('GitHub CLI Error Classes', () => {
  it('should create GitHubAuthError with correct properties', () => {
    const error = new GitHubAuthError('test auth error');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('GitHubAuthError');
    expect(error.code).toBe(401);
    expect(error.message).toContain('Authentication required');
    expect(error.message).toContain('gh auth login');
  });

  it('should create GitHubRateLimitError with correct properties', () => {
    const error = new GitHubRateLimitError('test rate limit', 3600);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('GitHubRateLimitError');
    expect(error.code).toBe(429);
    expect(error.resetTime).toBe(3600);
    expect(error.message).toContain('Rate limit exceeded');
  });

  it('should create GitHubNetworkError with correct properties', () => {
    const error = new GitHubNetworkError('test network error');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('GitHubNetworkError');
    expect(error.code).toBe(503);
    expect(error.message).toContain('Network error');
  });
});

describe('GitHub CLI Module Exports', () => {
  it('should export required functions', async () => {
    const module = await import('../../scripts/lib/github-cli.js');

    expect(typeof module.executeGH).toBe('function');
    expect(typeof module.ghAPI).toBe('function');
    expect(typeof module.ghRepo).toBe('function');
    expect(typeof module.GitHubAuthError).toBe('function');
    expect(typeof module.GitHubRateLimitError).toBe('function');
    expect(typeof module.GitHubNetworkError).toBe('function');
  });
});
