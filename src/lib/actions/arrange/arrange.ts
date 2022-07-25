import type { Action } from 'svelte/action';
import {
  $dragging,
  draggable as draggableAction,
  DraggableEvent,
  getGroupId,
  Parameter as DraggableParameter,
} from '../draggable';
import {
  dropEntityEventType,
  droppable,
  DroppableEvent,
  Parameter as DroppableParameter,
} from '../droppable';
import OrderedPosition from './OrderedPosition';
import { draggable, dragging } from './style';

const orderedPosition = new OrderedPosition();

let $sibling: DroppableEvent['currentTarget'] = null;

const dragstart: DraggableParameter['dragstart'] = (event) => {
  event.currentTarget.classList.add(dragging);
};

const dragend: DraggableParameter['dragend'] = (event) => {
  event.currentTarget.classList.remove(dragging);
  $sibling = null;
};

const dragenter: DroppableParameter['dragenter'] = (
  event: DraggableEvent & DroppableEvent,
  $dragging
) => {
  if ($dragging === event.currentTarget) {
    return;
  }

  $sibling = event.currentTarget;
  const isNext = $sibling.nextElementSibling === $dragging;
  $sibling.parentNode.insertBefore(
    $dragging,
    isNext ? $sibling : $sibling.nextElementSibling
  );
};

const handleDropEntity = () => {
  if (!$sibling) {
    return;
  }

  $dragging.dispatchEvent(
    new CustomEvent<DropPositionEvent['detail']>('dropPosition', {
      detail: {
        siblingId: Number($sibling.dataset.id),
        position: orderedPosition.getBetween(
          getGroupId(),
          $dragging.previousElementSibling === $sibling,
          Number($sibling.dataset.position)
        ),
      },
    })
  );
};

export interface Arrangeable {
  position: number;
  id: number;
}

interface Parameter extends Arrangeable {
  groupId: Symbol;
}

const set = (node: HTMLElement, { id, position }: Parameter) => {
  node.dataset.id = String(id);
  node.dataset.position = String(position);
};

export const arrange: Action<HTMLElement, Parameter | null> = (
  node,
  parameter
) => {
  if (parameter === null) {
    return {};
  }

  node.classList.add(draggable);

  const { groupId, position } = parameter;
  set(node, parameter);
  orderedPosition.add(groupId, position);

  const { update: updateDraggable, destroy: destoryDraggable } =
    draggableAction(node, { groupId, dragstart, dragend });

  node.addEventListener(dropEntityEventType, handleDropEntity);
  const { update: updateDroppable, destroy: destroyDroppable } = droppable(
    node,
    { groupId, dragenter }
  );

  return {
    update(updatedParameter: Parameter) {
      set(node, updatedParameter);
      orderedPosition.replace(groupId, position, updatedParameter.position);

      updateDraggable({
        groupId: updatedParameter.groupId,
        dragstart,
        dragend,
      });
      updateDroppable({ groupId: updatedParameter.groupId, dragenter });
    },
    destroy() {
      orderedPosition.remove(groupId, Number(node.dataset.position));

      destoryDraggable();

      node.removeEventListener(dropEntityEventType, handleDropEntity);
      destroyDroppable();
    },
  };
};
