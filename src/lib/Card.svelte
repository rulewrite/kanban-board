<script lang="ts" context="module">
  import Button, { Label } from '@smui/button';
  import Card, { Actions, Content } from '@smui/card';
  import type { TextfieldComponentDev } from '@smui/textfield';
  import Textfield from '@smui/textfield';
  import HelperText from '@smui/textfield/helper-text';
  import { uniq, uniqueId } from 'lodash-es';
  import { onDestroy, tick } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';
  import { createArrange } from './actions/arrange';
  import { Card as CardType, cardApi, Section } from './api/jsonPlaceholder';
  import IdBadge from './IdBadge.svelte';
  import PositionBadge from './PositionBadge.svelte';
  import { createEditId } from './store/editId';
  import { mapKeyToEntities } from './store/entities';
  import { unsubscribeErrorHandler } from './utils';

  const sections = mapKeyToEntities.sections;
  const cards = mapKeyToEntities.cards;
  const arrange = createArrange({
    isHorizontal: false,
    positions: mapKeyToEntities.cards.positions,
  });

  export const groupId = Symbol('cardsArrange');
  const editCardId = createEditId();
</script>

<script lang="ts">
  export let id: CardType['id'] = null;
  export let sectionId: Section['id'] = NaN;
  const editId = String(id ?? uniqueId('create_card_'));

  let bodyInput: TextfieldComponentDev;
  let body = '';
  let isHover = false;

  $: card = $cards[id];
  $: isEdit = $editCardId === editId;

  const unsubscribers: Array<Unsubscriber> = [
    editCardId.subscribe(async (id) => {
      if (id !== editId) {
        return;
      }

      body = card?.body ?? '';

      await tick();

      bodyInput?.focus();
    }),
  ];

  function toggleEdit() {
    editCardId.toggle(editId);
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

    card ? update() : create();
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

    const unsubscriber = cardApi
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

        sections.updateEntity(sectionId, ({ comments, ...section }) => {
          return { ...section, comments: uniq([...comments, id]) };
        });
        editCardId.off(editId);
        unsubscriber();
      });
    unsubscribers.push(unsubscriber);
  }

  function update() {
    const body = validate();
    if (!body) {
      return;
    }

    const unsubscriber = cardApi
      .update({ id, body })
      .subscribe(({ isFetching, failMessage }) => {
        if (isFetching) {
          return;
        }

        if (failMessage) {
          return;
        }

        editCardId.off(editId);
        unsubscriber();
      });
    unsubscribers.push(unsubscriber);
  }

  function deleteCard() {
    const unsubscriber = cardApi
      .delete({ id })
      .subscribe(({ isFetching, failMessage }) => {
        if (isFetching) {
          return;
        }

        if (failMessage) {
          return;
        }

        editCardId.off(editId);
        unsubscriber();
      });
    unsubscribers.push(unsubscriber);
  }

  function updatePosition(event: ChangePositionEvent) {
    const movedSectionId = $cards[event.detail.siblingId].postId;

    const unsubscriber = cardApi
      .update({
        id,
        body: {
          postId: movedSectionId,
          position: event.detail.position,
        },
      })
      .subscribe(async ({ isFetching, failMessage }) => {
        if (isFetching) {
          return;
        }

        if (failMessage) {
          return;
        }

        if (sectionId === movedSectionId) {
          return;
        }

        sections.updateEntity(sectionId, ({ comments, ...section }) => {
          return { ...section, comments: comments.filter((i) => i !== id) };
        });

        sections.updateEntity(movedSectionId, ({ comments, ...section }) => {
          return { ...section, comments: uniq([...comments, id]) };
        });

        unsubscriber();
      });
    unsubscribers.push(unsubscriber);
  }

  onDestroy(() => {
    try {
      unsubscribers.forEach((unsubscriber) => unsubscriber());
    } catch (error) {
      unsubscribeErrorHandler(error);
    }
  });
</script>

<div
  class="wrapper"
  use:arrange={card
    ? {
        groupId,
        id: card.id,
        position: card.position,
      }
    : null}
  on:changePosition={updatePosition}
>
  <Card
    variant="outlined"
    on:mouseover={() => (isHover = true)}
    on:mouseleave={() => (isHover = false)}
  >
    <IdBadge {id} isSubColor={true} />
    <PositionBadge position={card?.position} isSubColor={true} />

    {#if isEdit}
      <Content>
        <Textfield
          bind:this={bodyInput}
          bind:value={body}
          required
          label="Body"
          on:keydown={handleKeydown}
        >
          <HelperText validationMsg slot="helper">
            내용을 올바르게 입력해주세요.
          </HelperText>
        </Textfield>
      </Content>
    {:else if card}
      <Content>
        {card.body}
        <p class="mdc-typography--caption">{card.email}</p>
      </Content>
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
