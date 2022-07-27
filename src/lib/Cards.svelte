<script lang="ts" context="module">
  import { Content } from '@smui/paper';
  import { uniq } from 'lodash-es';
  import { onDestroy } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';
  import { droppable, Parameter } from './actions/droppable';
  import { Card as CardType, cardApi, Section } from './api/jsonPlaceholder';
  import Card, { groupId } from './Card.svelte';
  import { isDeleted, mapKeyToEntities } from './store/entities';

  const sections = mapKeyToEntities.sections;
  const cards = mapKeyToEntities.cards;

  const dragenter: Parameter['dragenter'] = (event, $dragging) => {
    event.currentTarget.parentNode.insertBefore($dragging, event.currentTarget);
  };
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

  let updateUnsubscribe: Unsubscriber;

  const moveCard: Parameter['drop'] = (e, dragging) => {
    const cardId = dragging.getProps().id;
    const prevSectionId = cardEntities[cardId].postId;

    updateUnsubscribe = cardApi
      .update({
        id: cardId,
        body: { postId: sectionId },
      })
      .subscribe(({ isFetching, failMessage }) => {
        if (isFetching) {
          return;
        }

        if (failMessage) {
          return;
        }

        sections.updateEntity(prevSectionId, ({ comments, ...seciton }) => {
          return {
            ...seciton,
            comments: comments.filter((id) => id !== cardId),
          };
        });

        sections.updateEntity(sectionId, ({ comments, ...seciton }) => {
          return {
            ...seciton,
            comments: uniq([...(comments ?? []), cardId]),
          };
        });
      });
  };

  onDestroy(() => {
    updateUnsubscribe && updateUnsubscribe();
  });
</script>

{#if cardIds.length}
  <Content>
    <div class="mdc-typography--caption">{cardIds}</div>

    {#each cardIds as cardId (cardId)}
      <Card id={cardId} {sectionId} />
    {/each}
  </Content>
{/if}
<div
  use:droppable={{
    groupIds: [groupId],
    dragenter,
    drop: moveCard,
  }}
>
  <Card {sectionId} />
</div>
