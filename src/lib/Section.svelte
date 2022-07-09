<script lang="ts">
  import Paper, { Subtitle, Title } from '@smui/paper';
  import type { Section } from './api/api';
  import { mapKeyToEntities } from './store/entities';

  const sections = mapKeyToEntities.sections;

  export let id: Section['id'];
</script>

<div class="placeholder">
  <Paper>
    {#if id}
      {@const section = $sections[id]}
      <Title>{section.title}</Title>
      <Subtitle>{section.body}</Subtitle>
    {/if}
  </Paper>
</div>

<style>
  .placeholder {
    margin-right: 16px;
  }
</style>
