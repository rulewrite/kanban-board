<script lang="ts">
  import Chip, { Set, Text } from '@smui/chips';

  export let ids: Array<number> = [];
</script>

{#if ids.length}
  <Set chips={ids} let:chip nonInteractive>
    <Chip {chip}>
      <Text>{chip}</Text>
    </Chip>
  </Set>
{/if}
