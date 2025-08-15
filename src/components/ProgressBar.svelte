<script lang="ts">
  import type { Milestone } from '../types/app.js';

  export let milestone: Milestone | null = null;
</script>

{#if milestone}
  <div class="mb-4">
    <div class="text-sm font-semibold mb-2">🎯 Milestone: {milestone.title}</div>
    <div class="bg-gray-200 h-2 rounded overflow-hidden">
      <div 
        class="bg-success-500 h-full transition-all duration-300 ease-in-out" 
        style="width: {milestone.progress}%"
      ></div>
    </div>
    <div class="text-xs text-gray-500 mt-1">
      {milestone.closedIssues} closed / {milestone.totalIssues} total issues ({milestone.progress}%)
    </div>
  </div>
{:else}
  <div class="mb-4">
    <div class="text-sm font-semibold mb-2">🎯 Milestone: No active milestone</div>
    <div class="bg-gray-200 h-2 rounded overflow-hidden">
      <div class="bg-success-500 h-full transition-all duration-300 ease-in-out" style="width: 0%"></div>
    </div>
    <div class="text-xs text-gray-500 mt-1">No milestone set</div>
  </div>
{/if}