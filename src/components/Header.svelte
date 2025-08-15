<script lang="ts">
  export let title: string = "🚀 App Development Dashboard";
  export let lastUpdated: string | undefined = undefined;
  export let appCount: number | undefined = undefined;

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  $: formattedDate = lastUpdated ? formatDate(lastUpdated) : undefined;
</script>

<header class="header">
  <h1 class="text-2xl font-semibold mb-2">{title}</h1>
  {#if lastUpdated || appCount}
    <div class="flex items-center gap-5 mt-2">
      {#if formattedDate}
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded text-sm">
          <span class="font-semibold text-gray-600">最終更新:</span>
          <time datetime={lastUpdated} class="text-gray-800">
            {formattedDate}
          </time>
        </div>
      {/if}
      {#if appCount !== undefined}
        <span class="text-gray-600 text-sm">アプリ数: {appCount}</span>
      {/if}
    </div>
  {/if}
</header>