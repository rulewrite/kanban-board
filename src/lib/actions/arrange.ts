import { css } from '@emotion/css';
import type { Positions } from 'src/lib/store/positions';
import type { Action } from 'svelte/action';
import { createPropsElement } from '../store/propsElement';
import {
  draggable,
  dragging,
  Parameter as DraggableParameter,
} from './draggable';
import {
  droppable,
  DroppableHTMLElement,
  Parameter as DroppableParameter,
} from './droppable';

const draggableClassName = css`
  cursor: pointer;
`;

const draggingClassName = css`
  opacity: 0.5;
  position: relative;
  overflow: hidden;
  border-radius: 5px;

  ::after {
    content: '';
    position: absolute;
    z-index: 3;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: #ccc;
  }
`;

const { utils } = createPropsElement<{
  isHorizontal: boolean;
  groupId: Symbol;
  id: number;
  position: number;
  positions: Positions;
}>();

type ArrangealbeHTMLElement = ReturnType<typeof utils['setNodeProps']>;

export const getUpdatePostion = (d: typeof dragging) => {
  const draggingElement = d.getElement();

  const prevElement =
    draggingElement.previousElementSibling as ArrangealbeHTMLElement;
  const prevPorps = prevElement && utils.getNodeProps(prevElement);
  if (prevElement && prevPorps) {
    const { positions, position } = prevPorps;
    return {
      siblingElement: prevElement,
      position: positions.getBetween(true, position),
    };
  }

  const nextElement =
    draggingElement.nextElementSibling as ArrangealbeHTMLElement;
  const nextProps = nextElement && utils.getNodeProps(nextElement);
  if (nextElement && nextProps) {
    const { positions, position } = nextProps;
    return {
      siblingElement: nextElement,
      position: positions.getBetween(false, position),
    };
  }

  return null;
};

const mouse = {
  x: NaN,
  y: NaN,
};

const dragstart: DraggableParameter['dragstart'] = (event) => {
  const currentTarget = event.currentTarget;
  setTimeout(() => {
    currentTarget.classList.add(draggingClassName);
  });
};

const dragend: DraggableParameter['dragend'] = (event) => {
  mouse.x = NaN;
  mouse.y = NaN;
  event.currentTarget.classList.remove(draggingClassName);
};

const dragenter: DroppableParameter['dragenter'] = (event) => {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
};

const dragover: DroppableParameter['dragover'] = (event, draggingElement) => {
  const currentTarget = event.currentTarget as DroppableHTMLElement &
    ArrangealbeHTMLElement;

  const isToPrev = utils.getNodeProps(currentTarget).isHorizontal
    ? mouse.x > event.clientX
    : mouse.y > event.clientY;

  currentTarget.parentNode.insertBefore(
    draggingElement,
    isToPrev ? currentTarget : currentTarget.nextElementSibling
  );
};

const drop: DroppableParameter['drop'] = (e, dragging) => {
  const updatePostion = getUpdatePostion(dragging);
  if (!updatePostion) {
    return;
  }

  const { siblingElement, position } = updatePostion;

  const draggingElement = dragging.getElement();
  draggingElement.dispatchEvent(
    new CustomEvent<ChangePositionEvent['detail']>('changePosition', {
      detail: {
        siblingId: utils.getNodeProps(siblingElement).id,
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
    { groupIds: [groupId], dragenter, dragover, drop }
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
        dragover,
        drop,
      });
    },
    destroy() {
      destoryDraggable();

      destroyDroppable();
    },
  };
};
