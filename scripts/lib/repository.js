/**
 * Repository information retrieval utilities
 */

import { ghAPI } from './github-cli.js';

/**
 * Get repository basic information
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<object>} Repository information
 */
export async function getRepositoryInfo(owner, repo) {
  const endpoint = `repos/${owner}/${repo}`;
  const data = await ghAPI(endpoint);
  
  return {
    name: data.name,
    fullName: data.full_name,
    description: data.description,
    defaultBranch: data.default_branch,
    language: data.language,
    topics: data.topics || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    url: data.html_url,
    owner: data.owner.login,
    private: data.private,
  };
}

/**
 * Get app name from repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} fallbackName - Fallback name if app name cannot be detected
 * @returns {Promise<string>} App name
 */
export async function getAppName(owner, repo, fallbackName) {
  // TODO: Implement app name extraction from package.json, pubspec.yaml, etc.
  return fallbackName || repo;
}