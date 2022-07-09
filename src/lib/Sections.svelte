<script lang="ts">
  import { onMount } from 'svelte';
  import { sectionApi } from './api/api';
  import Section from './Section.svelte';

  let status: ReturnType<typeof sectionApi.readList>;

  onMount(() => {
    status = sectionApi.readList({ _page: 1, _limit: 5 });
  });
</script>

<div class="wrapper">
  {#each $status?.cargo ?? [] as id (id)}
    <Section {id} />
  {/each}
</div>

<style>
  .wrapper {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    min-height: 800px;
  }
</style>
