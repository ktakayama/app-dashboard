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
 * Get file content from repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} path - File path
 * @returns {Promise<string|null>} File content or null if not found
 */
async function getFileContent(owner, repo, path) {
  try {
    const endpoint = `repos/${owner}/${repo}/contents/${path}`;
    const data = await ghAPI(endpoint);
    
    if (data.content) {
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return content;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Extract app name from package.json
 * @param {string} content - package.json content
 * @returns {string|null} App name or null
 */
function extractFromPackageJson(content) {
  try {
    const pkg = JSON.parse(content);
    return pkg.displayName || pkg.productName || pkg.name || null;
  } catch (error) {
    return null;
  }
}

/**
 * Extract app name from pubspec.yaml
 * @param {string} content - pubspec.yaml content
 * @returns {string|null} App name or null
 */
function extractFromPubspec(content) {
  try {
    const nameMatch = content.match(/^name:\s*(.+)$/m);
    if (nameMatch) {
      return nameMatch[1].trim();
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Extract app name from app.json (React Native)
 * @param {string} content - app.json content
 * @returns {string|null} App name or null
 */
function extractFromAppJson(content) {
  try {
    const app = JSON.parse(content);
    return app.expo?.name || app.name || null;
  } catch (error) {
    return null;
  }
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