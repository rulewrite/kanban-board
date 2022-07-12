<script lang="ts">
  import Button, { Label } from '@smui/button';
  import Card, { Actions, Content } from '@smui/card';
  import type { TextfieldComponentDev } from '@smui/textfield';
  import Textfield from '@smui/textfield';
  import HelperText from '@smui/textfield/helper-text';
  import { uniq, uniqueId } from 'lodash-es';
  import { onDestroy } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';
  import { fade } from 'svelte/transition';
  import { Card as CardType, cardApi, Section } from './api/jsonPlaceholder';
  import { editCardId } from './store/editId';
  import { mapKeyToEntities } from './store/entities';

  const sections = mapKeyToEntities.sections;
  const cards = mapKeyToEntities.cards;

  export let id: CardType['id'] = null;
  export let sectionId: Section['id'] = NaN;

  let bodyInput: TextfieldComponentDev;
  let body = '';
  let isHover = false;

  $: card = $cards[id];
  $: editId = String(id ?? uniqueId('create_card_'));
  $: isEdit = $editCardId === editId;
  $: isShowButtons = (card && isHover) || isEdit;

  let createUnsubscribe: Unsubscriber;
  let updateUnsubscribe: Unsubscriber;
  let deleteUnsubscribe: Unsubscriber;

  function toggleEdit() {
    if (!isEdit) {
      body = card?.body ?? '';
    }

    editCardId.toggle(editId);
  }

  function validate() {
    const trimedBody = body.trim();

    if (!trimedBody) {
      bodyInput.focus();
      return;
    }

    return {
      body: trimedBody,
    };
  }

  function create() {
    const body = validate();
    if (!body) {
      return;
    }

    createUnsubscribe = cardApi
      .create({
        body: { ...body, postId: sectionId },
      })
      .subscribe(({ isFetching, failMessage, id }) => {
        if (isFetching) {
          return;
        }

        if (failMessage) {
          return;
        }

        sections.updateProperty(sectionId, ({ comments, ...section }) => {
          return { ...section, comments: uniq([...comments, id]) };
        });
        editCardId.off(editId);
      });
  }

  function update() {
    const body = validate();
    if (!body) {
      return;
    }

    updateUnsubscribe = cardApi
      .update({ id, body })
      .subscribe(({ isFetching, failMessage }) => {
        if (isFetching) {
          return;
        }

        if (failMessage) {
          return;
        }

        editCardId.off(editId);
      });
  }

  onDestroy(() => {
    createUnsubscribe && createUnsubscribe();
    updateUnsubscribe && updateUnsubscribe();
    deleteUnsubscribe && deleteUnsubscribe();
  });
</script>

<div class="wrapper">
  <Card
    variant="outlined"
    on:mouseover={() => (isHover = true)}
    on:mouseleave={() => (isHover = false)}
  >
    {#if isEdit}
      <Content>
        <Textfield
          bind:this={bodyInput}
          bind:value={body}
          required
          label="Body"
        >
          <HelperText validationMsg slot="helper">
            내용을 올바르게 입력해주세요.
          </HelperText>
        </Textfield>
      </Content>
    {:else if card}
      <Content>
        {card.body}
      </Content>
    {/if}

    {#if isShowButtons}
      <div transition:fade>
        <Actions>
          {#if isEdit}
            <Button on:click={toggleEdit}>
              <Label>취소</Label>
            </Button>
            <Button on:click={card ? update : create}>
              <Label>{card ? '완료' : '생성'}</Label>
            </Button>
          {:else}
            <Button on:click={toggleEdit}>
              <Label>수정</Label>
            </Button>
          {/if}
        </Actions>
      </div>
    {/if}

    {#if !isEdit && !card}
      <Actions>
        <Button color="primary" on:click={toggleEdit}>
          <Label>카드 생성하기</Label>
        </Button>
      </Actions>
    {/if}
  </Card>
</div>

<style>
  .wrapper {
    min-width: 300px;
    margin-top: 16px;
  }
</style>
