<script lang="ts">
  import Card, { Content } from '@smui/card';
  import type { Card as CardType } from './api/api';
  import { mapKeyToEntities } from './store/entities';

  const cards = mapKeyToEntities.cards;

  export let id: CardType['id'] = 0;

  $: card = $cards[id];
</script>

<div class="wrapper">
  <Card variant="outlined">
    <Content>{card.body}</Content>
  </Card>
</div>

<style>
  .wrapper {
    margin-top: 16px;
  }
</style>
