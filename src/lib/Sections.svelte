<script lang="ts">
  import Button, { Group } from '@smui/button';
  import { onMount } from 'svelte';
  import { sectionApi } from './api/api';
  import Section from './Section.svelte';

  let status: ReturnType<typeof sectionApi.readList>;

  $: requestKey = $status?.key;

  function getSections() {
    status = sectionApi.readList({ _page: 1, _limit: 5, _embed: 'comments' });
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

<div class="wrapper">
  {#each $status?.cargo ?? [] as id (id)}
    <Section {id} {requestKey} />
  {/each}
  <Section {requestKey} />
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
