<script lang="ts">
  export let state: 'open' | 'merged' | 'closed';
  export let prNumber: number;
  export let title: string;

  // State styling configuration using TailwindCSS classes
  const stateStyles = {
    open: 'bg-success-500 text-white',
    merged: 'bg-purple-500 text-white',
    closed: 'bg-error-500 text-white'
  };

  $: currentStateStyle = stateStyles[state];
</script>

<li class="p-2 bg-gray-100 rounded mb-1 text-sm list-none">
  <span class="inline-block px-1.5 py-0.5 rounded text-xs font-semibold uppercase mr-2 {currentStateStyle}">
    {state === 'open' ? 'Open' : state === 'merged' ? 'Merged' : 'Closed'}
  </span>
  #{prNumber}: {title}
</li>