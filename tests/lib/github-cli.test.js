/**
 * Simple tests for GitHub CLI wrapper
 */

import { describe, it, expect } from 'vitest';
import { executeGH, ghAPI, ghRepo } from '../../scripts/lib/github-cli.js';

describe('GitHub CLI Module', () => {
  it('should export required functions', () => {
    expect(typeof executeGH).toBe('function');
    expect(typeof ghAPI).toBe('function');
    expect(typeof ghRepo).toBe('function');
  });
});
