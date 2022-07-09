<script lang="ts">
  import Paper, { Subtitle, Title } from '@smui/paper';
  import { onMount } from 'svelte';
  import { sectionApi } from './api/api';
  import { mapKeyToEntities } from './store/entities';

  const sections = mapKeyToEntities.sections;
  let status: ReturnType<typeof sectionApi.readList>;

  onMount(() => {
    status = sectionApi.readList({ _page: 1, _limit: 5 });
  });
</script>

<div class="wrapper">
  {#each $status?.cargo ?? [] as id (id)}
    {@const section = $sections[id]}
    <div class="placeholder">
      <Paper>
        <Title>{section.title}</Title>
        <Subtitle>{section.body}</Subtitle>
      </Paper>
    </div>
  {/each}
</div>

<style>
  .wrapper {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    min-height: 800px;
  }

  .placeholder {
    margin-right: 16px;
  }
</style>
