<script lang="ts" context="module">
  const groupId = Symbol('cardsArrange');
</script>

<script lang="ts">
  import Button, { Label } from '@smui/button';
  import Card, { Actions, Content } from '@smui/card';
  import type { TextfieldComponentDev } from '@smui/textfield';
  import Textfield from '@smui/textfield';
  import HelperText from '@smui/textfield/helper-text';
  import { uniq, uniqueId } from 'lodash-es';
  import { onDestroy, tick } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';
  import { arrange } from './actions/arrange';
  import { Card as CardType, cardApi, Section } from './api/jsonPlaceholder';
  import IdBadge from './IdBadge.svelte';
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

  let createUnsubscribe: Unsubscriber;
  let updateUnsubscribe: Unsubscriber;
  let deleteUnsubscribe: Unsubscriber;

  async function toggleEdit() {
    editCardId.toggle(editId);

    if (!isEdit) {
      body = card?.body ?? '';

      await tick();

      bodyInput?.focus();
    }
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

  function deleteCard() {
    deleteUnsubscribe = cardApi
      .delete({ id })
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

  function updatePosition(event: CustomEvent) {
    updateUnsubscribe = cardApi
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
  class="wrapper"
  use:arrange={card
    ? {
        groupId,
        id: card.id,
        position: card.position,
        updatePosition,
      }
    : null}
>
  <Card
    variant="outlined"
    on:mouseover={() => (isHover = true)}
    on:mouseleave={() => (isHover = false)}
  >
    <IdBadge {id} />

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
      <Content>{card.body}</Content>
    {/if}

    {#if (card && isHover) || isEdit}
      <Actions>
        {#if isEdit}
          {#if card}
            <Button on:click={deleteCard} color="secondary">
              <Label>삭제</Label>
            </Button>
          {/if}
          <Button on:click={toggleEdit} color="secondary">
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
    margin-top: 16px;
  }
</style>
