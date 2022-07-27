<script lang="ts" context="module">
  import { Content } from '@smui/paper';
  import type { Card as CardType, Section } from './api/jsonPlaceholder';
  import Card from './Card.svelte';
  import { isDeleted, mapKeyToEntities } from './store/entities';

  const cards = mapKeyToEntities.cards;
</script>

<script lang="ts">
  export let sectionId: Section['id'] = NaN;
  export let ids: Array<CardType['id']> = [];

  $: cardEntities = $cards;
  $: cardIds = ids
    .map((id) => cardEntities[id])
    .filter((cartd) => !cartd?.[isDeleted])
    .sort((a, b) => a.position - b.position)
    .map(({ id }) => id);
</script>

{#if cardIds.length}
  <Content>
    <div class="mdc-typography--caption">{cardIds}</div>

    {#each cardIds as cardId (cardId)}
      <Card id={cardId} {sectionId} />
    {/each}
  </Content>
{/if}
<Card {sectionId} />
