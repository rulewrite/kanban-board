<script lang="ts" context="module">
  import Button, { Group, Label } from '@smui/button';
  import Paper, { Content, Subtitle, Title } from '@smui/paper';
  import type { TextfieldComponentDev } from '@smui/textfield';
  import Textfield from '@smui/textfield';
  import HelperText from '@smui/textfield/helper-text';
  import { uniqueId } from 'lodash-es';
  import { createEventDispatcher, onDestroy, tick } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';
  import { arrange } from './actions/arrange/arrange';
  import { clickOutside } from './actions/clickOutside';
  import { droppable, Parameter } from './actions/droppable';
  import { Section, sectionApi } from './api/jsonPlaceholder';
  import Card, { groupId as cardGroupId } from './Card.svelte';
  import IdBadge from './IdBadge.svelte';
  import { createEditId } from './store/editId';
  import { isDeleted, mapKeyToEntities } from './store/entities';

  const sections = mapKeyToEntities.sections;
  const cards = mapKeyToEntities.cards;

  export const groupId = Symbol('sectionsArrange');
  const editSectionId = createEditId();
  const exceptClickOutsideDataset = 'data-except-click-outside';
  const dragenter: Parameter['dragenter'] = (event, $dragging) => {
    event.currentTarget.appendChild($dragging);
  };
</script>

<script lang="ts">
  const dispatch = createEventDispatcher<{ createdId: number }>();

  export let id: Section['id'] = null;
  const editId = String(id ?? uniqueId('create_section_'));

  let titleInput: TextfieldComponentDev;
  let title = '';
  let body = '';

  $: section = $sections[id];
  $: isEdit = $editSectionId === editId;
  $: cardEntities = $cards;
  $: cardIds = (section?.comments ?? [])
    .map((id) => cardEntities[id])
    .filter((cartd) => !cartd?.[isDeleted])
    .sort((a, b) => a.position - b.position)
    .map(({ id }) => id);

  let createUnsubscribe: Unsubscriber;
  let updateUnsubscribe: Unsubscriber;
  let deleteUnsubscribe: Unsubscriber;
  const unsubscribers: Array<Unsubscriber> = [
    editSectionId.subscribe(async (id) => {
      if (id !== editId) {
        return;
      }

      title = section?.title ?? '';
      body = section?.body ?? '';

      await tick();

      titleInput?.focus();
    }),
  ];

  function toggleEdit() {
    editSectionId.toggle(editId);
  }

  function handleKeydown(e: CustomEvent) {
    const event = e as unknown as KeyboardEvent;

    if (event.key === 'Esc' || event.key === 'Escape') {
      toggleEdit();
      return;
    }

    if (event.key !== 'Enter') {
      return;
    }

    section ? update() : create();
  }

  function validate() {
    const trimedTitle = title.trim();

    if (!trimedTitle) {
      titleInput.focus();
      return;
    }

    return {
      title: trimedTitle,
      body: body.trim(),
    };
  }

  function create() {
    const body = validate();
    if (!body) {
      return;
    }

    createUnsubscribe = sectionApi
      .create({ body })
      .subscribe(({ isFetching, failMessage, id }) => {
        if (isFetching) {
          return;
        }

        if (failMessage) {
          return;
        }

        dispatch('createdId', id);

        editSectionId.off(editId);
      });
  }

  function update() {
    const body = validate();
    if (!body) {
      return;
    }

    updateUnsubscribe = sectionApi
      .update({ id, body })
      .subscribe(({ isFetching, failMessage }) => {
        if (isFetching) {
          return;
        }

        if (failMessage) {
          return;
        }

        editSectionId.off(editId);
      });
  }

  function deleteSection() {
    deleteUnsubscribe = sectionApi
      .delete({ id })
      .subscribe(({ isFetching, failMessage }) => {
        if (isFetching) {
          return;
        }

        if (failMessage) {
          return;
        }

        editSectionId.off(editId);
      });
  }

  function dropPosition(event: DropPositionEvent) {
    updateUnsubscribe = sectionApi
      .update({
        id,
        body: {
          position: event.detail.position,
        },
      })
      .subscribe(({ isFetching, failMessage }) => {
        if (isFetching) {
          return;
        }

        if (failMessage) {
          return;
        }
      });
  }

  const createSectionWithCard: Parameter['drop'] = (e, dragging) => {
    const cardId = dragging.getProps().id;

    createUnsubscribe = sectionApi
      .create({ body: { title: 'title', comments: [cardId] } })
      .subscribe(async ({ isFetching, failMessage, id }) => {
        if (isFetching) {
          return;
        }

        if (failMessage) {
          return;
        }

        dispatch('createdId', id);

        const card = cardEntities[cardId];
        sections.updateEntity(card.postId, ({ comments, ...seciton }) => {
          return {
            ...seciton,
            comments: comments.filter((id) => id !== cardId),
          };
        });

        cards.updateEntity(cardId, (card) => {
          return {
            ...card,
            postId: id,
          };
        });

        await tick();

        editSectionId.toggle(String(id));
      });
  };

  onDestroy(() => {
    createUnsubscribe && createUnsubscribe();
    updateUnsubscribe && updateUnsubscribe();
    deleteUnsubscribe && deleteUnsubscribe();
    unsubscribers.forEach((unsubscriber) => unsubscriber());
  });
</script>

<div
  class="placeholder"
  use:arrange={section
    ? {
        groupId,
        id: section.id,
        position: section.position,
      }
    : null}
  on:dropPosition={dropPosition}
>
  <Paper
    use={[
      [
        droppable,
        section
          ? null
          : { groupIds: [cardGroupId], dragenter, drop: createSectionWithCard },
      ],
    ]}
  >
    <IdBadge {id} />

    {#if isEdit}
      <Content
        use={[[clickOutside, exceptClickOutsideDataset]]}
        on:outClick={toggleEdit}
      >
        <Textfield
          bind:this={titleInput}
          bind:value={title}
          required
          label="Title"
          on:keydown={handleKeydown}
        >
          <HelperText validationMsg slot="helper">
            타이틀을 올바르게 입력해주세요.
          </HelperText>
        </Textfield>

        <Textfield
          textarea
          bind:value={body}
          label="Description"
          on:keydown={handleKeydown}
        >
          <HelperText slot="helper">섹션 설명</HelperText>
        </Textfield>
      </Content>
    {:else if section}
      <div on:click={toggleEdit}>
        <Title>{section.title}</Title>
        <Subtitle>{section.body ?? ''}</Subtitle>
      </div>
    {/if}

    {#if isEdit}
      <Content {...{ [exceptClickOutsideDataset]: true }}>
        <Group variant="unelevated">
          {#if section}
            <Button on:click={deleteSection} color="secondary">
              <Label>삭제</Label>
            </Button>
          {/if}
          <Button on:click={section ? update : create}>
            <Label>{section ? '완료' : '생성'}</Label>
          </Button>
        </Group>
      </Content>
    {/if}

    {#if !isEdit && !section}
      <Button color="primary" on:click={toggleEdit}>
        <Label>섹션 생성하기</Label>
      </Button>
    {/if}

    {#if section}
      {#if cardIds.length}
        <Content>
          <div class="mdc-typography--caption">{cardIds}</div>

          {#each cardIds as cardId (cardId)}
            <Card id={cardId} sectionId={section.id} />
          {/each}
        </Content>
      {/if}
      <Card sectionId={section.id} />
    {/if}
  </Paper>
</div>

<style>
  .placeholder {
    min-width: 300px;
    margin-right: 16px;
    position: relative;
  }
</style>
