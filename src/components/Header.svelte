<script lang="ts">
  export let title: string = "🚀 App Development Dashboard";
  export let lastUpdated: string | undefined = undefined;
  export let appCount: number | undefined = undefined;
</script>

<header class="header">
  <h1 class="text-2xl font-semibold mb-2">{title}</h1>
  {#if lastUpdated || appCount}
    <div class="flex items-center gap-5 mt-2">
      {#if lastUpdated}
        <div class="last-updated">Last updated: {lastUpdated}</div>
      {/if}
      {#if appCount !== undefined}
        <span class="text-gray-600 text-sm">アプリ数: {appCount}</span>
      {/if}
    </div>
  {/if}
</header>