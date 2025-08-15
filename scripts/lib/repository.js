/**
 * Repository information retrieval utilities
 */

import { ghAPI } from './github-cli.js';

/**
 * Get repository basic information
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<object>} Repository information
 * @throws {Error} If repository cannot be accessed
 */
export async function getRepositoryInfo(owner, repo) {
  if (!owner || !repo) {
    throw new Error('Repository owner and name are required');
  }

  try {
    const endpoint = `repos/${owner}/${repo}`;
    const data = await ghAPI(endpoint);

    if (!data || !data.name) {
      throw new Error(`Invalid repository data for ${owner}/${repo}`);
    }

    return {
      name: data.name,
      fullName: data.full_name,
      description: data.description || '',
      defaultBranch: data.default_branch || 'main',
      language: data.language || null,
      topics: data.topics || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      url: data.html_url,
      owner: data.owner.login,
      private: data.private || false,
    };
  } catch (error) {
    if (error.message.includes('gh command failed')) {
      throw new Error(
        `Failed to access repository ${owner}/${repo}: ${error.message}`
      );
    }
    throw error;
  }
}
