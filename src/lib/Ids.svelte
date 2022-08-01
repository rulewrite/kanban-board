<script lang="ts">
  export let ids: Array<number> = [];
</script>

{#if ids.length}
  <div class="ids">{ids.join(', ')}</div>
{/if}

<style>
  .ids {
    font-size: 14px;
    line-height: 1.3;

    padding: 3px;
    margin: 10px 0;
    background: #eee;
    color: #111;
    border-radius: 3px;
  }
</style>
