<script lang="ts">
  import Badge from '@smui-extra/badge';
  export let id: number;
</script>

{#if id}
  <Badge
    square
    position="inset"
    align="top-start"
    aria-label="id"
    color="secondary">{id}</Badge
  >
{/if}
