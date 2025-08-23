<script lang="ts">
  export let platforms: string[];

  // Platform-specific styling configuration
  const platformStyles: Record<string, { bg: string; text: string; label: string }> = {
    ios: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      label: 'iOS',
    },
    android: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      label: 'Android',
    },
  };

  // Default style for unknown platforms
  const defaultStyle = {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    label: 'Unknown',
  };

  function getStyleForPlatform(platform: string) {
    return (
      platformStyles[platform.toLowerCase()] || {
        ...defaultStyle,
        label: platform,
      }
    );
  }
</script>

{#if platforms && platforms.length > 0}
  <div class="flex gap-1 flex-wrap">
    {#each platforms as platform}
      {@const style = getStyleForPlatform(platform)}
      <span class="inline-block px-2 py-0.5 rounded text-xs font-medium {style.bg} {style.text}">
        {style.label}
      </span>
    {/each}
  </div>
{:else}
  <span class="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-500">
    No Platform
  </span>
{/if}
