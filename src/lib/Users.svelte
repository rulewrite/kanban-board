<script lang="ts" context="module">
  import Chip, { Set, Text, TrailingIcon } from '@smui/chips';
  import { onDestroy, onMount } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';
  import { User, userApi } from './api/jsonPlaceholder';
  import { isDeleted, mapKeyToEntities } from './store/entities';
  import { unsubscribeErrorHandler } from './utils';

  const users = mapKeyToEntities.users;
</script>

<script lang="ts">
  let status: ReturnType<typeof userApi.readList>;

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

<Set chips={validUsers} let:chip={user} key={(user) => user.id}>
  <Chip chip={user.id}>
    <Text>{user.email}</Text>
    <TrailingIcon class="material-icons" on:click={() => deleteUser(user.id)}>
      cancel
    </TrailingIcon>
  </Chip>
</Set>

<style>
</style>
