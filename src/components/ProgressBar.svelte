<script lang="ts">
  import type { Milestone } from '../types/app.js';

  export let milestone: Milestone | null = null;
</script>

{#if milestone}
  <div class="milestone-section">
    <div class="milestone-title">🎯 Milestone: {milestone.title}</div>
    <div class="progress-bar">
      <div 
        class="progress-fill" 
        style="width: {milestone.progress}%"
      ></div>
    </div>
    <div class="progress-text">
      {milestone.closedIssues} closed / {milestone.totalIssues} total issues ({milestone.progress}%)
    </div>
  </div>
{:else}
  <div class="milestone-section">
    <div class="milestone-title">🎯 Milestone: No active milestone</div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: 0%"></div>
    </div>
    <div class="progress-text">No milestone set</div>
  </div>
{/if}

<style>
  .milestone-section {
    margin-bottom: 15px;
  }

  .milestone-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .progress-bar {
    background: #e4e6ea;
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    background: #00875a;
    height: 100%;
    transition: width 0.3s ease;
  }

  .progress-text {
    font-size: 12px;
    color: #6b778c;
    margin-top: 5px;
  }
</style>