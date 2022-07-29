import type { Positions } from 'src/lib/store/positions';
import type { Action } from 'svelte/action';
import { createPropsElement } from '../../store/propsElement';
import {
  draggable,
  dragging,
  Parameter as DraggableParameter,
} from '../draggable';
import { droppable, Parameter as DroppableParameter } from '../droppable';
import {
  draggable as draggableClassName,
  dragging as draggingClassName,
} from './style';

const { utils } = createPropsElement<{
  groupId: Symbol;
  id: number;
  position: number;
  positions: Positions;
}>();

type ArrangealbeHTMLElement = ReturnType<typeof utils['setNodeProps']>;

export const getUpdatePostion = (d: typeof dragging) => {
  const $dragging = d.getElement();

  const prevElement =
    $dragging.previousElementSibling as ArrangealbeHTMLElement;
  const prevPorps = prevElement && utils.getNodeProps(prevElement);
  if (prevElement && prevPorps) {
    const { positions, position } = prevPorps;
    return {
      $sibling: prevElement,
      position: positions.getBetween(true, position),
    };
  }

  const nextElement = $dragging.nextElementSibling as ArrangealbeHTMLElement;
  const nextProps = nextElement && utils.getNodeProps(nextElement);
  if (nextElement && nextProps) {
    const { positions, position } = nextProps;
    return {
      $sibling: nextElement,
      position: positions.getBetween(false, position),
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

type Parameter = ReturnType<typeof utils['getNodeProps']>;

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

  const { id, groupId } = parameter;
  set(node, parameter);

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
