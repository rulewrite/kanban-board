import type { ActionReturn } from 'svelte/action';

const groupIdKey = Symbol('groupId');
const dragstartKey = Symbol('dragstart');
const dragendKey = Symbol('dragend');

type DraggableEvent = HTMLElementIncludeDragEvent<{
  [groupIdKey]: Symbol;
  [dragstartKey]?: (e: DraggableEvent) => void;
  [dragendKey]?: (e: DraggableEvent) => void;
}>;

export let $dragging: DraggableEvent['currentTarget'] = null;

export const getGroupId = () => $dragging[groupIdKey];

const mapEventTypeToListener = new Map<string, EventListener>([
  [
    // 엘리먼트나 텍스트 블록을 드래그하기 시작할 때
    'dragstart',
    (event: DraggableEvent) => {
      event.stopPropagation();

      $dragging = event.currentTarget;
      $dragging?.[dragstartKey](event);
    },
  ],
  [
    // 드래그가 끝났을 때 (마우스 버튼을 떼거나 ESC 키를 누를 때)
    'dragend',
    (event: DraggableEvent) => {
      event.stopPropagation();

      $dragging = null;
      event.currentTarget?.[dragendKey](event);
    },
  ],
] as const);

export interface Parameter {
  groupId: DraggableEvent['currentTarget'][typeof groupIdKey];
  dragstart?: DraggableEvent['currentTarget'][typeof dragstartKey];
  dragend?: DraggableEvent['currentTarget'][typeof dragendKey];
}

const set = (node: HTMLElement, { groupId, dragstart, dragend }: Parameter) => {
  node[groupIdKey] = groupId;
  dragstart ? (node[dragstartKey] = dragstart) : delete node[dragstartKey];
  dragend ? (node[dragendKey] = dragend) : delete node[dragendKey];
};

export function draggable(
  node: HTMLElement,
  parameter: Parameter | null
): ActionReturn<Parameter> {
  if (!parameter) {
    return {};
  }

  node.setAttribute('draggable', 'true');

  set(node, parameter);
  mapEventTypeToListener.forEach((listener, eventType) => {
    node.addEventListener(eventType, listener);
  });

  return {
    update(updatedParameter) {
      set(node, updatedParameter);
    },
    destroy() {
      mapEventTypeToListener.forEach((listener, eventType) => {
        node.removeEventListener(eventType, listener);
      });
    },
  };
}
