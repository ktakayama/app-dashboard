<script lang="ts">
  import type { App } from '../types/app.js';
  import PlatformBadge from './PlatformBadge.svelte';
  import ProgressBar from './ProgressBar.svelte';
  import PRStateLabel from './PRStateLabel.svelte';

  export let app: App;
</script>

<div class="app-card">
  <!-- App Header Section -->
  <div class="app-header">
    <img
      src={app.icon}
      alt="{app.name} Icon"
      class="app-icon"
    />
    <div class="app-info">
      <div class="app-name">{app.name}</div>
      <div class="app-meta">
        <PlatformBadge platform={app.platform} />
        <span class="repository-name">{app.repository}</span>
      </div>
    </div>
  </div>

  <!-- Version Section -->
  <div class="version-section">
    {#if app.latestRelease}
      <div class="version-row">
        <span class="version-label">GitHub Latest:</span>
        <span><strong>{app.latestRelease.version}</strong> ({app.latestRelease.date})</span>
      </div>
    {/if}
    {#if app.storeVersions && (app.storeVersions.appStore || app.storeVersions.playStore)}
      <div class="version-row">
        <span class="version-label">Store Versions:</span>
        <div class="store-versions">
          {#if app.storeVersions.appStore}
            <span class="store-version-item">
              📱 App Store: <strong>{app.storeVersions.appStore}</strong>
            </span>
          {/if}
          {#if app.storeVersions.playStore}
            <span class="store-version-item">
              🤖 Play Store: <strong>{app.storeVersions.playStore}</strong>
            </span>
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <!-- Milestone Progress Section -->
  <ProgressBar milestone={app.milestone} />

  <!-- Pull Requests Section -->
  <div class="pr-section">
    <div class="pr-title">📝 Recent Pull Requests</div>
    {#if app.recentPRs && app.recentPRs.length > 0}
      <ul class="pr-list">
        {#each app.recentPRs as pr}
          <PRStateLabel state={pr.state} prNumber={pr.number} title={pr.title} />
        {/each}
      </ul>
    {:else}
      <ul class="pr-list">
        <li class="pr-item no-prs">No recent pull requests</li>
      </ul>
    {/if}
  </div>

  <!-- Links Section -->
  <div class="links-section">
    <a href={app.links.github} class="link-button primary" target="_blank" rel="noopener">
      GitHub
    </a>
    {#if app.links.appStore}
      <a href={app.links.appStore} class="link-button secondary" target="_blank" rel="noopener">
        App Store
      </a>
    {/if}
    {#if app.links.playStore}
      <a href={app.links.playStore} class="link-button secondary" target="_blank" rel="noopener">
        Play Store
      </a>
    {/if}
  </div>
</div>

<style>
  .app-card {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .app-header {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .app-icon {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    background: #ddd;
    object-fit: cover;
  }

  .app-info {
    flex: 1;
  }

  .app-name {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 5px;
    color: #172b4d;
  }

  .app-meta {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .repository-name {
    color: #6b778c;
    font-size: 12px;
  }

  .version-section {
    padding: 15px;
    background: #f4f5f7;
    border-radius: 6px;
  }

  .version-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
    font-size: 14px;
    gap: 10px;
  }

  .version-row:last-child {
    margin-bottom: 0;
  }

  .version-label {
    color: #6b778c;
    font-weight: 500;
    min-width: 110px;
  }

  .store-versions {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
  }

  .store-version-item {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .pr-section {
    background: #fafbfc;
    padding: 15px;
    border-radius: 6px;
  }

  .pr-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 10px;
    color: #172b4d;
  }

  .pr-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .pr-item.no-prs {
    padding: 12px;
    background: #f4f5f7;
    border-radius: 4px;
    color: #6b778c;
    font-style: italic;
    text-align: center;
    font-size: 13px;
  }

  .links-section {
    display: flex;
    gap: 10px;
  }

  .link-button {
    flex: 1;
    padding: 10px 16px;
    text-align: center;
    text-decoration: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
    border: 1px solid transparent;
  }

  .link-button.primary {
    background: #0052cc;
    color: white;
  }

  .link-button.primary:hover {
    background: #0747a6;
  }

  .link-button.secondary {
    background: #f4f5f7;
    color: #172b4d;
    border-color: #dfe1e6;
  }

  .link-button.secondary:hover {
    background: #ebecf0;
    border-color: #c1c7d0;
  }
</style>