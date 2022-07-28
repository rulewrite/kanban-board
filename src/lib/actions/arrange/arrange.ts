import type { Action } from 'svelte/action';
import { createPropsElement } from '../../store/propsElement';
import {
  draggable,
  dragging,
  Parameter as DraggableParameter,
} from '../draggable';
import { droppable, Parameter as DroppableParameter } from '../droppable';
import OrderedPosition from './OrderedPosition';
import {
  draggable as draggableClassName,
  dragging as draggingClassName,
} from './style';

const orderedPosition = new OrderedPosition();

export interface Arrangeable {
  id: number;
  position: number;
}

const { utils } = createPropsElement<Arrangeable>();

type ArrangealbeHTMLElement = ReturnType<typeof utils['setNodeProps']>;

export const removePosition = (groupId: Symbol, position: number) => {
  orderedPosition.remove(groupId, position);
};

export const getUpdatePostion = (d: typeof dragging) => {
  const groupId = d.getProps().groupId;
  const $dragging = d.getElement();

  const prevElement =
    $dragging.previousElementSibling as ArrangealbeHTMLElement;
  const prevPosition = utils.getNodeProps(prevElement)?.position;
  if (prevElement && prevPosition) {
    return {
      $sibling: prevElement,
      position: orderedPosition.getBetween(groupId, true, prevPosition),
    };
  }

  const nextElement = $dragging.nextElementSibling as ArrangealbeHTMLElement;
  const nextPosition = utils.getNodeProps(nextElement)?.position;
  if (nextElement && nextPosition) {
    return {
      $sibling: nextElement,
      position: orderedPosition.getBetween(groupId, false, nextPosition),
    };
  }

  return null;
};

const dragstart: DraggableParameter['dragstart'] = (event) => {
  event.currentTarget.classList.add(draggingClassName);
};

const dragend: DraggableParameter['dragend'] = (event) => {
  event.currentTarget.classList.remove(draggingClassName);
};

const dragenter: DroppableParameter['dragenter'] = (event, $dragging) => {
  const $sibling = event.currentTarget;
  const isNext = $sibling.nextElementSibling === $dragging;
  $sibling.parentNode.insertBefore(
    $dragging,
    isNext ? $sibling : $sibling.nextElementSibling
  );
};

const drop: DroppableParameter['drop'] = (e, dragging) => {
  const updatePostion = getUpdatePostion(dragging);
  if (!updatePostion) {
    return;
  }

  const { $sibling, position } = updatePostion;

  const $dragging = dragging.getElement();
  $dragging.dispatchEvent(
    new CustomEvent<DropPositionEvent['detail']>('dropPosition', {
      detail: {
        siblingId: utils.getNodeProps($sibling).id,
        position,
      },
    })
  );
};

interface Parameter extends Arrangeable {
  groupId: Symbol;
}

const set = (node: HTMLElement, parameter: Parameter) => {
  utils.setNodeProps(node, parameter);
};

export const arrange: Action<HTMLElement, Parameter | null> = (
  node,
  parameter
) => {
  if (parameter === null) {
    return {};
  }

  node.classList.add(draggableClassName);

  const { id, groupId, position } = parameter;
  set(node, parameter);
  orderedPosition.add(groupId, position);

  const { update: updateDraggable, destroy: destoryDraggable } = draggable(
    node,
    { id, groupId, dragstart, dragend }
  );

  const { update: updateDroppable, destroy: destroyDroppable } = droppable(
    node,
    { groupIds: [groupId], dragenter, drop }
  );

  return {
    update(updatedParameter: Parameter) {
      set(node, updatedParameter);
      orderedPosition.replace(groupId, position, updatedParameter.position);

      updateDraggable({
        id: updatedParameter.id,
        groupId: updatedParameter.groupId,
        dragstart,
        dragend,
      });
      updateDroppable({
        groupIds: [updatedParameter.groupId],
        dragenter,
        drop,
      });
    },
    destroy() {
      destoryDraggable();

      destroyDroppable();
    },
  };
};
