<script lang="ts">
  import Fab, { Icon, Label } from '@smui/fab';
  import { onDestroy } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';
  import { dragging } from './actions/draggable';
  import { dragentered, droppable, Parameter } from './actions/droppable';
  import { cardApi, sectionApi } from './api/jsonPlaceholder';
  import { groupId as cardGroupId } from './Card.svelte';
  import { groupId as sectionGroupId } from './Section.svelte';

  let isHover = false;
  let deleteUnsubscribe: Unsubscriber;

  const dragenter: Parameter['dragenter'] = (e, $dragging) => {
    $dragging.hidden = true;
    isHover = true;
  };

  const dragleave: Parameter['dragleave'] = (e, $dragging) => {
    $dragging.hidden = false;
    isHover = false;

    dragentered.clear();
  };

  const deleteEntity: Parameter['drop'] = (e, dragging) => {
    // exited 애니메이션으로 사라지는 시간 만큼 지연
    setTimeout(() => {
      isHover = false;
    }, 500);

    const api =
      dragging.getProps().groupId === cardGroupId ? cardApi : sectionApi;

    deleteUnsubscribe = api
      .delete({ id: dragging.getProps().id })
      .subscribe(({ isFetching, failMessage }) => {
        if (isFetching) {
          return;
        }

        if (failMessage) {
          return;
        }
      });
  };

  onDestroy(() => {
    deleteUnsubscribe && deleteUnsubscribe();
  });
</script>

<Fab
  class="delete"
  color={isHover ? 'primary' : 'secondary'}
  exited={!$dragging}
  extended
  use={[
    [
      droppable,
      {
        groupIds: [sectionGroupId, cardGroupId],
        dragenter,
        dragleave,
        drop: deleteEntity,
      },
    ],
  ]}
>
  <Icon class="material-icons">delete</Icon>
  <Label>Delete</Label>
</Fab>

<style>
  :global(.delete) {
    position: fixed;
    bottom: 50px;
    right: 50px;
    z-index: 1;
  }
</style>
