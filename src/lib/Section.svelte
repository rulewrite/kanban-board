<script lang="ts">
  import Button, { Group, Label } from '@smui/button';
  import Paper, { Content, Subtitle, Title } from '@smui/paper';
  import type { TextfieldComponentDev } from '@smui/textfield';
  import Textfield from '@smui/textfield';
  import HelperText from '@smui/textfield/helper-text';
  import { onDestroy } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';
  import { Section, sectionApi } from './api/api';
  import Card from './Card.svelte';
  import type { Status } from './modules/status-api/status';
  import { editSectionId } from './store/editId';
  import { mapKeyToEntities } from './store/entities';

  const sections = mapKeyToEntities.sections;

  export let id: Section['id'] = 0;
  export let requestKey: string = '';

  let titleInput: TextfieldComponentDev;
  let title = '';
  let body = '';

  $: section = $sections[id];
  $: isEdit = $editSectionId === id;

  let createUnsubscribe: Unsubscriber;
  let updateUnsubscribe: Unsubscriber;
  let deleteUnsubscribe: Unsubscriber;

  function toggleEdit() {
    if (!isEdit) {
      title = section?.title ?? '';
      body = section?.body ?? '';
    }

    editSectionId.toggle(id);
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

  function postProcess({ isFetching, failMessage }: Status<unknown>) {
    if (isFetching) {
      return;
    }

    if (failMessage) {
      return;
    }

    editSectionId.off(id);
  }

  function create() {
    const body = validate();
    if (!body) {
      return;
    }

    createUnsubscribe = sectionApi
      .create(body, requestKey)
      .subscribe(postProcess);
  }

  function update() {
    const body = validate();
    if (!body) {
      return;
    }

    updateUnsubscribe = sectionApi.update(id, body).subscribe(postProcess);
  }

  function deleteSection() {
    deleteUnsubscribe = sectionApi
      .delete(id, requestKey)
      .subscribe(postProcess);
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

    {#if section?.comments?.length}
      <Content>
        {#each section.comments as id (id)}
          <Card {id} />
        {/each}
      </Content>
    {/if}
  </Paper>
</div>

<style>
  .placeholder {
    margin-right: 16px;
  }
</style>
