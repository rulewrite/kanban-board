<script lang="ts">
  import DeleteArea from './lib/DeleteArea.svelte';

  import Main from './lib/Main.svelte';
  import Sections from './lib/Sections.svelte';
  import Topbar from './lib/Topbar.svelte';
</script>

<Topbar />
<Main>
  <DeleteArea />
  <Sections />
</Main>
