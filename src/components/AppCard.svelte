<script lang="ts">
  import type { App } from '../types/app.js';
  import PlatformBadge from './PlatformBadge.svelte';
  import ProgressBar from './ProgressBar.svelte';
  import PRStateLabel from './PRStateLabel.svelte';

  export let app: App;
</script>

<div class="bg-white rounded-lg p-5 shadow-card flex flex-col gap-4">
  <!-- App Header Section -->
  <div class="flex items-center gap-4">
    <img
      src={app.icon}
      alt="{app.name} Icon"
      class="w-16 h-16 rounded-icon bg-gray-300 object-cover"
    />
    <div class="flex-1">
      <div class="text-lg font-semibold mb-1 text-gray-900">{app.name}</div>
      <div class="flex items-center gap-2.5">
        <PlatformBadge platform={app.platform} />
        <span class="text-gray-500 text-xs">{app.repository}</span>
      </div>
    </div>
  </div>

  <!-- Version Section -->
  <div class="p-4 bg-gray-100 rounded-md">
    {#if app.latestRelease}
      <div class="flex justify-between items-start mb-2 text-sm gap-2.5">
        <span class="text-gray-500 font-medium min-w-28">GitHub Latest:</span>
        <span><strong>{app.latestRelease.version}</strong> ({app.latestRelease.date})</span>
      </div>
    {/if}
    {#if app.storeVersions && (app.storeVersions.appStore || app.storeVersions.playStore)}
      <div class="flex justify-between items-start text-sm gap-2.5">
        <span class="text-gray-500 font-medium min-w-28">Store Versions:</span>
        <div class="flex flex-col gap-1 text-xs">
          {#if app.storeVersions.appStore}
            <span class="flex items-center gap-1">
              📱 App Store: <strong>{app.storeVersions.appStore}</strong>
            </span>
          {/if}
          {#if app.storeVersions.playStore}
            <span class="flex items-center gap-1">
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
  <div class="bg-gray-50 p-4 rounded-md">
    <div class="text-sm font-semibold mb-2.5 text-gray-900">📝 Recent Pull Requests</div>
    {#if app.recentPRs && app.recentPRs.length > 0}
      <ul class="list-none m-0 p-0 flex flex-col gap-1">
        {#each app.recentPRs as pr}
          <PRStateLabel state={pr.state} prNumber={pr.number} title={pr.title} />
        {/each}
      </ul>
    {:else}
      <ul class="list-none m-0 p-0">
        <li class="p-3 bg-gray-100 rounded text-gray-500 italic text-center text-xs">No recent pull requests</li>
      </ul>
    {/if}
  </div>

  <!-- Links Section -->
  <div class="flex gap-2.5">
    <a href={app.links.github} class="flex-1 py-2.5 px-4 text-center no-underline rounded-md text-sm font-medium transition-all duration-200 border border-transparent bg-primary-600 text-white hover:bg-primary-700" target="_blank" rel="noopener">
      GitHub
    </a>
    {#if app.links.appStore}
      <a href={app.links.appStore} class="flex-1 py-2.5 px-4 text-center no-underline rounded-md text-sm font-medium transition-all duration-200 border bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200 hover:border-gray-400" target="_blank" rel="noopener">
        App Store
      </a>
    {/if}
    {#if app.links.playStore}
      <a href={app.links.playStore} class="flex-1 py-2.5 px-4 text-center no-underline rounded-md text-sm font-medium transition-all duration-200 border bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200 hover:border-gray-400" target="_blank" rel="noopener">
        Play Store
      </a>
    {/if}
  </div>
</div>

