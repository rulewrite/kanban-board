<script lang="ts">
  import { onMount } from 'svelte';
  import { Section as SectionType, sectionApi } from './api/api';
  import Section from './Section.svelte';

  let status: ReturnType<typeof sectionApi.readList>;
  let editId: SectionType['id'] = NaN;

  onMount(() => {
    status = sectionApi.readList({ _page: 1, _limit: 5 });
  });
</script>

<div class="wrapper">
  {#each $status?.cargo ?? [] as id (id)}
    <Section {id} bind:editId />
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
