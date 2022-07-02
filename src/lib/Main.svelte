<script lang="ts">
  import LayoutGrid, { Cell } from '@smui/layout-grid';
</script>

<main>
  <LayoutGrid>
    <Cell span={12}>
      <slot />
    </Cell>
  </LayoutGrid>
</main>
