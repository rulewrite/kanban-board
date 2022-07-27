<script lang="ts">
  import Ripple from '@smui/ripple';
  import { onDestroy } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';
  import { slide } from 'svelte/transition';
  import { dragging } from './actions/draggable';
  import { dragentered, droppable, Parameter } from './actions/droppable';
  import { cardApi, sectionApi } from './api/jsonPlaceholder';
  import { groupId as cardGroupId } from './Card.svelte';
  import { groupId as sectionGroupId } from './Section.svelte';

  let deleteArea: HTMLDivElement;
  let active = false;
  let deleteUnsubscribe: Unsubscriber;

  const dragenter: Parameter['dragenter'] = (e, $dragging) => {
    $dragging.hidden = true;

    active = true;
    deleteArea.dispatchEvent(new MouseEvent('mousedown'));
  };

  const dragleave: Parameter['dragleave'] = (e, $dragging) => {
    $dragging.hidden = false;

    dragentered.clear();
    active = false;
  };

  const deleteEntity: Parameter['drop'] = (e, dragging) => {
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

{#if $dragging}
  <div transition:slide>
    <div
      id="trashCan"
      bind:this={deleteArea}
      use:Ripple={{ surface: true, active }}
      use:droppable={{
        groupIds: [sectionGroupId, cardGroupId],
        dragenter,
        dragleave,
        drop: deleteEntity,
      }}
    >
      <b>Delete Area</b>
    </div>
  </div>
{/if}

<style>
  #trashCan {
    height: 300px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 40px;
    color: #ddd;
    border: 8px dashed #ddd;
    box-sizing: border-box;
    margin-bottom: 20px;
  }
</style>
