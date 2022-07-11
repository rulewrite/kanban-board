<script lang="ts">
  import Paper, { Subtitle, Title } from '@smui/paper';
  import { onMount } from 'svelte';
  import { sectionApi } from './api/api';

  let status: ReturnType<typeof sectionApi.readList>;

  onMount(() => {
    status = sectionApi.readList({ _page: 1, _limit: 5 });
  });
</script>

<div class="wrapper">
  {#each $status?.cargo ?? [] as section (section.id)}
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
