import {
  dropEntityEventType,
  droppable,
  Parameter as DroppableParameter,
} from '../droppable';
import OrderedPosition, { Id, Position } from './OrderedPosition';
import { draggable, dragging } from './style';

export const groupIdKey = Symbol('groupId');
const orderedPosition = new OrderedPosition();

export let $dragging: HTMLElement = null;
let $sibling: HTMLElement = null;

export interface Arrangeable {
  position: Position;
  id: number;
}

const dragenter: DroppableParameter['dragenter'] = (event, $dragging) => {
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
          $dragging[groupIdKey],
          $dragging.previousElementSibling === $sibling,
          Number($sibling.dataset.position)
        ),
      },
    })
  );
};

const mapEventTypeToListener = new Map<string, EventListener>([
  [
    // 엘리먼트나 텍스트 블록을 드래그하기 시작할 때
    'dragstart',
    (event: HTMLElementIncludeDragEvent) => {
      event.stopPropagation();

      event.currentTarget.classList.add(dragging);
      $dragging = event.currentTarget;
    },
  ],
  [
    // 드래그가 끝났을 때 (마우스 버튼을 떼거나 ESC 키를 누를 때)
    'dragend',
    (event: HTMLElementIncludeDragEvent) => {
      event.stopPropagation();

      event.currentTarget.classList.remove(dragging);
      $dragging = null;
      $sibling = null;
    },
  ],
] as const);

interface Parameter extends Arrangeable {
  groupId: Id;
}

const set = (node: HTMLElement, { id, position, groupId }: Parameter) => {
  node.dataset.id = String(id);
  node.dataset.position = String(position);
  node[groupIdKey] = groupId;
};

export function arrange(node: HTMLElement, parameter: Parameter | null) {
  if (parameter === null) {
    return {};
  }

  node.setAttribute('draggable', 'true');
  node.classList.add(draggable);

  const { groupId, position } = parameter;
  set(node, parameter);
  orderedPosition.add(groupId, position);

  node.addEventListener(dropEntityEventType, handleDropEntity);
  const { update: updateDroppable, destroy: destroyDroppable } = droppable(
    node,
    { groupId, dragenter }
  );

  mapEventTypeToListener.forEach((listener, eventType) => {
    node.addEventListener(eventType, listener);
  });

  return {
    update(updatedParameter: Parameter) {
      set(node, updatedParameter);
      orderedPosition.replace(groupId, position, updatedParameter.position);

      updateDroppable({ groupId: updatedParameter.groupId, dragenter });
    },
    destroy() {
      orderedPosition.remove(groupId, Number(node.dataset.position));

      node.removeEventListener(dropEntityEventType, handleDropEntity);
      destroyDroppable();

      mapEventTypeToListener.forEach((listener, eventType) => {
        node.removeEventListener(eventType, listener);
      });
    },
  };
}
