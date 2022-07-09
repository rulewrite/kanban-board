<script lang="ts">
  import Paper, { Subtitle, Title } from '@smui/paper';

  let sections = [
    {
      id: 1,
      title:
        'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
      body: 'quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto',
      userId: 1,
    },
    {
      id: 2,
      title: 'qui est esse',
      body: 'est rerum tempore vitae\nsequi sint nihil reprehenderit dolor beatae ea dolores neque\nfugiat blanditiis voluptate porro vel nihil molestiae ut reiciendis\nqui aperiam non debitis possimus qui neque nisi nulla',
      userId: 1,
    },
  ];
</script>

<div class="wrapper">
  {#each sections as section}
    <div class="placeholder">
      <Paper>
        <Title>{section.title}</Title>
        <Subtitle>{section.body}</Subtitle>
      </Paper>
    </div>
  {/each}
</div>

<style>
  .wrapper {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    min-height: 800px;
  }

  .placeholder {
    margin-right: 16px;
  }
</style>
