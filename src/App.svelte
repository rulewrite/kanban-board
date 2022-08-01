<script lang="ts">
  import DeleteArea from './lib/DeleteArea.svelte';
  import Main from './lib/Main.svelte';
  import Sections from './lib/Sections.svelte';
  import Topbar from './lib/Topbar.svelte';
  import Users from './lib/Users.svelte';
</script>

<Topbar />
<Main>
  <Users />
  <DeleteArea />
  <Sections />
</Main>
