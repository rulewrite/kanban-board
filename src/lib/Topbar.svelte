<script lang="ts">
  import TopAppBar, {
    Title,
    Row,
    Section,
    AutoAdjust,
    TopAppBarComponentDev,
  } from '@smui/top-app-bar';

  let topAppBar: TopAppBarComponentDev;
</script>

<TopAppBar bind:this={topAppBar} variant="fixed">
  <Row>
    <Section>
      <Title>Kanban Board</Title>
    </Section>
  </Row>
</TopAppBar>

<AutoAdjust {topAppBar} />
