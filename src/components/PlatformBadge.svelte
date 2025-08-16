<script lang="ts">
  export let platform: 'ios' | 'android' | 'both';

  // Platform-specific styling configuration
  const platformStyles = {
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
    both: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      label: 'iOS & Android',
    },
  };

  $: currentStyle = platformStyles[platform];
</script>

<span
  class="inline-block px-2 py-0.5 rounded text-xs font-medium {currentStyle.bg} {currentStyle.text}"
>
  {currentStyle.label}
</span>
