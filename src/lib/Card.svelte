<script lang="ts">
  import Button, { Label } from '@smui/button';
  import Card, { Actions, Content } from '@smui/card';
  import type { TextfieldComponentDev } from '@smui/textfield';
  import Textfield from '@smui/textfield';
  import HelperText from '@smui/textfield/helper-text';
  import { fade } from 'svelte/transition';
  import { Card as CardType, cardApi } from './api/jsonPlaceholder';
  import type { Status } from './modules/status-api/status';
  import { editCardId } from './store/editId';
  import { mapKeyToEntities } from './store/entities';

  const cards = mapKeyToEntities.cards;

  export let id: CardType['id'] = 0;

  let bodyInput: TextfieldComponentDev;
  let body = '';
  let isHover = false;

  $: card = $cards[id];
  $: isEdit = $editCardId === id;
  $: isShowButtons = isHover || isEdit;

  function toggleEdit() {
    if (!isEdit) {
      body = card?.body ?? '';
    }

    editCardId.toggle(id);
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

  function postProcess({ isFetching, failMessage }: Status) {
    if (isFetching) {
      return;
    }

    if (failMessage) {
      return;
    }

    editCardId.off(id);
  }

  function update() {
    const body = validate();
    if (!body) {
      return;
    }

    cardApi.update({ id, body }).subscribe(postProcess);
  }
</script>

<div class="wrapper">
  <Card
    variant="outlined"
    on:mouseover={() => (isHover = true)}
    on:mouseleave={() => (isHover = false)}
  >
    <Content>
      {#if isEdit}
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
      {:else}
        {card.body}
      {/if}
    </Content>

    {#if isShowButtons}
      <div transition:fade>
        <Actions>
          {#if isEdit}
            <Button on:click={toggleEdit}>
              <Label>취소</Label>
            </Button>
            <Button on:click={update}>
              <Label>완료</Label>
            </Button>
          {:else}
            <Button on:click={toggleEdit}>
              <Label>수정</Label>
            </Button>
          {/if}
        </Actions>
      </div>
    {/if}
  </Card>
</div>

<style>
  .wrapper {
    margin-top: 16px;
  }
</style>
