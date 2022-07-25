import type { ActionReturn } from 'svelte/action';

const groupIdKey = Symbol('groupId');
const dragstartKey = Symbol('dragstart');
const dragendKey = Symbol('dragend');

export let $dragging: HTMLElement = null;

export const getGroupId = () => $dragging[groupIdKey] as Symbol;

const mapEventTypeToListener = new Map<string, EventListener>([
  [
    // 엘리먼트나 텍스트 블록을 드래그하기 시작할 때
    'dragstart',
    (event: HTMLElementIncludeDragEvent) => {
      event.stopPropagation();

      $dragging = event.currentTarget;

      const dragstart = $dragging[dragstartKey];
      if (!dragstart) {
        return;
      }

      dragstart(event);
    },
  ],
  [
    // 드래그가 끝났을 때 (마우스 버튼을 떼거나 ESC 키를 누를 때)
    'dragend',
    (event: HTMLElementIncludeDragEvent) => {
      event.stopPropagation();

      $dragging = null;

      const dragend = event.currentTarget[dragendKey];
      if (!dragend) {
        return;
      }

      dragend(event);
    },
  ],
] as const);

export interface Parameter {
  groupId: Symbol;
  dragstart?: (e: HTMLElementIncludeDragEvent) => void;
  dragend?: (e: HTMLElementIncludeDragEvent) => void;
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
