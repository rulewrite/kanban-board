<script lang="ts" context="module">
  import Button, { Group, Label } from '@smui/button';
  import Paper, { Content, Subtitle, Title } from '@smui/paper';
  import type { TextfieldComponentDev } from '@smui/textfield';
  import Textfield from '@smui/textfield';
  import HelperText from '@smui/textfield/helper-text';
  import { uniqueId } from 'lodash-es';
  import { onDestroy, tick } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';
  import { arrange } from './actions/arrange/arrange';
  import { Section, sectionApi } from './api/jsonPlaceholder';
  import Card from './Card.svelte';
  import IdBadge from './IdBadge.svelte';
  import { createEditId } from './store/editId';
  import { isDeleted, mapKeyToEntities } from './store/entities';

  const groupId = Symbol('sectionsArrange');
  const editSectionId = createEditId();

  const sections = mapKeyToEntities.sections;
  const cards = mapKeyToEntities.cards;
</script>

<script lang="ts">
  export let id: Section['id'] = null;
  export let createdId = NaN;

  let titleInput: TextfieldComponentDev;
  let title = '';
  let body = '';

  $: section = $sections[id];
  $: editId = String(id ?? uniqueId('create_section_'));
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

  async function toggleEdit() {
    editSectionId.toggle(editId);

    if (!isEdit) {
      title = section?.title ?? '';
      body = section?.body ?? '';

      await tick();

      titleInput?.focus();
    }
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

        createdId = id;
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

  function updatePosition(event: CustomEvent) {
    updateUnsubscribe = sectionApi
      .update({
        id: event.detail.id,
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

  onDestroy(() => {
    createUnsubscribe && createUnsubscribe();
    updateUnsubscribe && updateUnsubscribe();
    deleteUnsubscribe && deleteUnsubscribe();
  });
</script>

<div
  class="placeholder"
  use:arrange={section
    ? {
        groupId,
        id: section.id,
        position: section.position,
        updatePosition,
      }
    : null}
>
  <Paper>
    <IdBadge {id} />

    {#if isEdit}
      <Content>
        <Textfield
          bind:this={titleInput}
          bind:value={title}
          required
          label="Title"
        >
          <HelperText validationMsg slot="helper">
            타이틀을 올바르게 입력해주세요.
          </HelperText>
        </Textfield>

        <Textfield textarea bind:value={body} label="Description">
          <HelperText slot="helper">섹션 설명</HelperText>
        </Textfield>
      </Content>
    {:else if section}
      <Title>{section.title}</Title>
      <Subtitle>{section.body}</Subtitle>
    {/if}

    {#if section || isEdit}
      <Content>
        {#if isEdit}
          <Group variant="unelevated">
            {#if section}
              <Button on:click={deleteSection} color="secondary">
                <Label>삭제</Label>
              </Button>
            {/if}
            <Button on:click={toggleEdit} color="secondary">
              <Label>취소</Label>
            </Button>
            <Button on:click={section ? update : create}>
              <Label>{section ? '완료' : '생성'}</Label>
            </Button>
          </Group>
        {:else}
          <Button on:click={toggleEdit}>
            <Label>수정</Label>
          </Button>
        {/if}
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
