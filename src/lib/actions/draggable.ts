import type { ActionReturn } from 'svelte/action';

const props = Symbol('props');

type DraggableEvent = HTMLElementIncludeDragEvent<{
  [props]: {
    id: number;
    groupId: Symbol;
    dragstart?: (e: DraggableEvent) => void;
    dragend?: (e: DraggableEvent) => void;
  };
}>;
export type DraggableHTMLElement = DraggableEvent['currentTarget'];

export let $dragging: DraggableHTMLElement = null;
export const getProps = ($element: DraggableHTMLElement) => $element[props];
export const getGroupId = () => getProps($dragging).groupId;

const mapEventTypeToListener = new Map<string, EventListener>([
  [
    // 엘리먼트나 텍스트 블록을 드래그하기 시작할 때
    'dragstart',
    (event: DraggableEvent) => {
      event.stopPropagation();

      $dragging = event.currentTarget;
      $dragging[props]?.dragstart(event);
    },
  ],
  [
    // 드래그가 끝났을 때 (마우스 버튼을 떼거나 ESC 키를 누를 때)
    'dragend',
    (event: DraggableEvent) => {
      event.stopPropagation();

      $dragging = null;
      event.currentTarget[props]?.dragend(event);
    },
  ],
] as const);

export type Parameter = DraggableHTMLElement[typeof props];

const set = (
  node: HTMLElement,
  { id, groupId, dragstart, dragend }: Parameter
) => {
  node[props] = { id, groupId, dragstart, dragend };
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
