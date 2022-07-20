<script lang="ts" context="module">
  import Button, { Group } from '@smui/button';
  import { onMount } from 'svelte';
  import { sectionApi } from './api/jsonPlaceholder';
  import Section from './Section.svelte';
  import { isDeleted, mapKeyToEntities } from './store/entities';

  const sections = mapKeyToEntities.sections;
</script>

<script lang="ts">
  let status: ReturnType<typeof sectionApi.readList>;

  $: sectionEntities = $sections;
  $: ids = ($status?.ids ?? [])
    .map((id) => sectionEntities[id])
    .filter((section) => !section?.[isDeleted])
    .sort((a, b) => a.position - b.position)
    .map(({ id }) => id);

  function getSections() {
    status = sectionApi.readList({
      params: { _page: 1, _limit: 5, _embed: 'comments' },
    });
  }

  onMount(() => {
    getSections();
  });
</script>

<div id="buttons">
  <Group>
    <Button on:click={getSections}>새로고침</Button>
  </Group>
</div>

<div class="mdc-typography--caption">{ids}</div>

<div class="wrapper">
  {#each ids as id (id)}
    <Section {id} />
  {/each}
  <Section
    on:createdId={(event) => {
      status?.push(event.detail);
    }}
  />
</div>

<style>
  #buttons {
    margin-bottom: 20px;
  }

  .wrapper {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    min-height: 800px;
  }
</style>
