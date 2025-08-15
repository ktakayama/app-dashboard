<script lang="ts">
  export let state: 'open' | 'merged' | 'closed';
  export let prNumber: number;
  export let title: string;
</script>

<li class="pr-item">
  <span class="pr-state {state}">{state === 'open' ? 'Open' : state === 'merged' ? 'Merged' : 'Closed'}</span>
  #{prNumber}: {title}
</li>

<style>
  .pr-item {
    padding: 8px;
    background: #f4f5f7;
    border-radius: 4px;
    margin-bottom: 5px;
    font-size: 13px;
    list-style: none;
  }

  .pr-state {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 11px;
    margin-right: 8px;
    font-weight: 600;
    text-transform: uppercase;
  }

  .pr-state.open {
    background: #00875a;
    color: white;
  }

  .pr-state.merged {
    background: #6554c0;
    color: white;
  }

  .pr-state.closed {
    background: #de350b;
    color: white;
  }
</style>