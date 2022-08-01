<script lang="ts" context="module">
  import Button from '@smui/button';
  import Chip, { Set, Text, TrailingIcon } from '@smui/chips';
  import Paper, { Content, Title } from '@smui/paper';
  import Textfield, { TextfieldComponentDev } from '@smui/textfield';
  import HelperText from '@smui/textfield/helper-text';
  import Icon from '@smui/textfield/icon';
  import { onDestroy, onMount } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';
  import { User, userApi } from './api/jsonPlaceholder';
  import { isDeleted, mapKeyToEntities } from './store/entities';
  import { unsubscribeErrorHandler } from './utils';

  const users = mapKeyToEntities.users;
</script>

<script lang="ts">
  let status: ReturnType<typeof userApi.readList>;
  let isAdd = false;
  let emailInput: TextfieldComponentDev;
  let email = '';

  $: userEntities = $users;
  $: validUsers = ($status?.ids ?? [])
    .map((id) => userEntities[id])
    .filter((user) => !user?.[isDeleted]);

  const unsubscribers: Array<Unsubscriber> = [];

  onMount(() => {
    status = userApi.readList({ params: {} });
  });

  onDestroy(() => {
    try {
      unsubscribers.forEach((unsubscriber) => unsubscriber());
    } catch (error) {
      unsubscribeErrorHandler(error);
    }
  });

  const toggle = () => {
    if (!isAdd) {
      email = '';
    }

    isAdd = !isAdd;
  };

  const handleKeydown = (e: CustomEvent) => {
    const event = e as unknown as KeyboardEvent;

    if (event.key === 'Esc' || event.key === 'Escape') {
      toggle();
      return;
    }

    if (event.key !== 'Enter') {
      return;
    }

    create();
  };

  const validate = () => {
    const trimedEmail = email.trim();

    if (!trimedEmail) {
      emailInput.focus();
      return;
    }

    return {
      email: trimedEmail,
    };
  };

  const create = () => {
    const body = validate();
    if (!body) {
      return;
    }

    const unsubscriber = userApi
      .create({ body })
      .subscribe(({ isFetching, failMessage, id }) => {
        if (isFetching) {
          return;
        }

        if (failMessage) {
          return;
        }

        unsubscriber();
        toggle();
        status?.push(id);
      });
    unsubscribers.push(unsubscriber);
  };

  const deleteUser = (id: User['id']) => {
    const unsubscriber = userApi
      .delete({ id })
      .subscribe(({ isFetching, failMessage }) => {
        if (isFetching) {
          return;
        }

        if (failMessage) {
          return;
        }

        unsubscriber();
      });
    unsubscribers.push(unsubscriber);
  };
</script>

<div class="wrapper">
  <Paper>
    <Title>담당자 리스트</Title>

    <Content>
      <Set chips={validUsers} let:chip={user} key={(user) => user.id}>
        <Chip chip={user.id}>
          <Text>{user.email}</Text>
          <TrailingIcon
            class="material-icons"
            on:click={() => deleteUser(user.id)}
          >
            cancel
          </TrailingIcon>
        </Chip>
      </Set>
    </Content>

    <Content>
      {#if isAdd}
        <Textfield
          bind:this={emailInput}
          bind:value={email}
          required
          label="Email"
          on:keydown={handleKeydown}
        >
          <svelte:fragment slot="trailingIcon">
            <Icon class="material-icons" role="button" on:click={create}>
              send
            </Icon>
          </svelte:fragment>
          <HelperText validationMsg slot="helper">
            이메일을 올바르게 입력해주세요.
          </HelperText>
        </Textfield>
      {:else}
        <Button on:click={toggle}>추가</Button>
      {/if}
    </Content>
  </Paper>
</div>

<style>
  .wrapper {
    margin-bottom: 20px;
  }
</style>
