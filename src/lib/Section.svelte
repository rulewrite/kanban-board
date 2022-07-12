<script lang="ts">
  import Button, { Group, Label } from '@smui/button';
  import Paper, { Content, Subtitle, Title } from '@smui/paper';
  import type { TextfieldComponentDev } from '@smui/textfield';
  import Textfield from '@smui/textfield';
  import HelperText from '@smui/textfield/helper-text';
  import { uniqueId } from 'lodash-es';
  import { onDestroy } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';
  import { Section, sectionApi } from './api/jsonPlaceholder';
  import Card from './Card.svelte';
  import { editSectionId } from './store/editId';
  import { mapKeyToEntities } from './store/entities';

  const sections = mapKeyToEntities.sections;

  export let id: Section['id'] = null;
  export let createdId = NaN;

  let titleInput: TextfieldComponentDev;
  let title = '';
  let body = '';

  $: section = $sections[id];
  $: editId = String(id ?? uniqueId('create_section_'));
  $: isEdit = $editSectionId === editId;

  let createUnsubscribe: Unsubscriber;
  let updateUnsubscribe: Unsubscriber;
  let deleteUnsubscribe: Unsubscriber;

  function toggleEdit() {
    if (!isEdit) {
      title = section?.title ?? '';
      body = section?.body ?? '';
    }

    editSectionId.toggle(editId);
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

  onDestroy(() => {
    createUnsubscribe && createUnsubscribe();
    updateUnsubscribe && updateUnsubscribe();
    deleteUnsubscribe && deleteUnsubscribe();
  });
</script>

<div class="placeholder">
  <Paper>
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
      </Content>
    {:else if section}
      <Title>{section.title}</Title>
      <Subtitle>{section.body}</Subtitle>
      <Content>
        <Button on:click={toggleEdit}>
          <Label>수정</Label>
        </Button>
      </Content>
    {:else}
      <Button color="primary" on:click={toggleEdit}>
        <Label>섹션 생성하기</Label>
      </Button>
    {/if}

    {#if section}
      {#if section?.comments?.length}
        <Content>
          {#each section.comments as id (id)}
            <Card {id} />
          {/each}
        </Content>
      {/if}
      <Card />
    {/if}
  </Paper>
</div>

<style>
  .placeholder {
    margin-right: 16px;
  }
</style>
