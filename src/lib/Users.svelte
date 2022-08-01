<script lang="ts" context="module">
  import Chip, { Set, Text } from '@smui/chips';
  import { onMount } from 'svelte';
  import { userApi } from './api/jsonPlaceholder';
  import { isDeleted, mapKeyToEntities } from './store/entities';

  const users = mapKeyToEntities.users;
</script>

<script lang="ts">
  let status: ReturnType<typeof userApi.readList>;

  $: userEntities = $users;
  $: validUsers = ($status?.ids ?? [])
    .map((id) => userEntities[id])
    .filter((user) => !user?.[isDeleted]);

  onMount(() => {
    status = userApi.readList({ params: {} });
  });
</script>

<Set chips={validUsers} let:chip={user} key={(user) => user.id}>
  <Chip chip={user.id}>
    <Text>{user.email}</Text>
  </Chip>
</Set>

<style>
</style>
