<script lang="ts">
  import Badge from '@smui-extra/badge';
  export let position: number;
  export let isSubColor = false;
</script>

{#if position}
  <Badge
    position="inset"
    aria-label="position"
    color={isSubColor ? 'secondary' : 'primary'}
  >
    {position}
  </Badge>
{/if}
