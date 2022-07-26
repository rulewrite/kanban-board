import type { ActionReturn } from 'svelte/action';
import { createPropsElement } from '../store/propsElement';

export const dragging = createPropsElement<{
  id: number;
  groupId: Symbol;
  dragstart?: (e: DraggableEvent) => void;
  dragend?: (e: DraggableEvent) => void;
}>();

export type DraggableHTMLElement = ReturnType<
  typeof dragging['utils']['setNodeProps']
>;

type DraggableEvent = HTMLElementIncludeDragEvent<DraggableHTMLElement>;

const mapEventTypeToListener = new Map<string, EventListener>([
  [
    // 엘리먼트나 텍스트 블록을 드래그하기 시작할 때
    'dragstart',
    (event: DraggableEvent) => {
      event.stopPropagation();

      dragging.bind(event.currentTarget);
      dragging.getProps()?.dragstart(event);
    },
  ],
  [
    // 드래그가 끝났을 때 (마우스 버튼을 떼거나 ESC 키를 누를 때)
    'dragend',
    (event: DraggableEvent) => {
      event.stopPropagation();

      dragging.clear();
      dragging.utils.getNodeProps(event.currentTarget)?.dragend(event);
    },
  ],
] as const);

export type Parameter = ReturnType<typeof dragging['getProps']>;

const set = (node: HTMLElement, parameter: Parameter) => {
  dragging.utils.setNodeProps(node, parameter);
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
