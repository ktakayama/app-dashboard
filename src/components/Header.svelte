<script lang="ts">
  export let title: string = "🚀 App Development Dashboard";
  export let lastUpdated: string | undefined = undefined;
  export let appCount: number | undefined = undefined;

  function formatToJST(dateString: string): string {
    const date = new Date(dateString);
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tokyo',
      hour12: false
    };
    
    const formatter = new Intl.DateTimeFormat('ja-JP', options);
    const parts = formatter.formatToParts(date);
    
    const dateParts: { [key: string]: string } = {};
    parts.forEach(part => {
      dateParts[part.type] = part.value;
    });
    
    return `${dateParts.year}年${dateParts.month}月${dateParts.day}日 ${dateParts.hour}:${dateParts.minute} JST`;
  }

  $: formattedDate = lastUpdated ? formatToJST(lastUpdated) : undefined;
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