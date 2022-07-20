<script lang="ts">
  import Badge from '@smui-extra/badge';
  export let id: number;
  export let isSubColor = false;
</script>

{#if id}
  <Badge
    square
    position="inset"
    align="top-start"
    aria-label="id"
    color={isSubColor ? 'secondary' : 'primary'}>{id}</Badge
  >
{/if}
