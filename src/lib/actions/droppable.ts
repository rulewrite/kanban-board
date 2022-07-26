import type { ActionReturn } from 'svelte/action';
import { get } from 'svelte/store';
import { createPropsElement } from '../store/propsElement';
import { DraggableHTMLElement, dragging } from './draggable';

export const dropEntityEventType = 'dropEntity';

export const dragentered = createPropsElement<{
  groupId: Symbol;
  dragenter?: (e: DroppableEvent, $dragging: DraggableHTMLElement) => void;
  dragleave?: (e: DroppableEvent, $dragging: DraggableHTMLElement) => void;
}>();

export type DroppableHTMLElement = ReturnType<
  typeof dragentered['utils']['setNodeProps']
>;

type DroppableEvent = HTMLElementIncludeDragEvent<DroppableHTMLElement>;

// 드래그 중인 대상이 적합한 드롭 대상 위에 있을 때 (수백 ms 마다 발생)
document.addEventListener('dragover', (event: DroppableEvent) => {
  /**
   * https://developer.mozilla.org/ko/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations#droptargets
   * 앱의 대부분의 영역은 적합한 드롭 대상이 아니므로 기본적으로 드롭을 허용하지 않도록 되어있음
   * 따라서 드롭을 허용하려면 기본 처리를 막아야 함.
   */
  event.preventDefault();
  event.stopPropagation();
  return false;
});

// 드래그 중인 대상을 적합한 드롭 대상에 드롭했을 때
document.addEventListener('drop', (event: DroppableEvent) => {
  /**
   * https://developer.mozilla.org/ko/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations#drop
   * 웹페지에서 드롭을 수락한 경우 기본 브라우저의 처리도 막아야 함.
   * 예로 링크를 웹페이지로 드래그하면 브라우저가 링크로 리다이렉션 됨.
   */
  event.preventDefault();
  event.stopPropagation();

  if (!dragentered.isBound()) {
    return;
  }

  if (dragging.getProps().groupId !== dragentered.getProps().groupId) {
    return;
  }

  get(dragentered).dispatchEvent(
    new CustomEvent<DropEntityEvent['detail']>(dropEntityEventType, {
      detail: { id: dragging.getProps().id },
    })
  );
});

const mapEventTypeToListener = new Map<string, EventListener>([
  [
    // 드래그 중인 대상이 적합한 드롭 대상위에 올라갔을 때
    'dragenter',
    (event: DroppableEvent) => {
      event.stopPropagation();

      const $currentTarget = event.currentTarget;
      if (
        dragging.getProps().groupId !==
        dragentered.utils.getNodeProps($currentTarget).groupId
      ) {
        return;
      }

      dragentered.bind($currentTarget);
      dragentered.getProps()?.dragenter(event, get(dragging));
    },
  ],
  [
    // 드래그 중인 대상이 적합한 드롭 대상에서 벗어났을 때
    'dragleave',
    (event: DroppableEvent) => {
      event.stopPropagation();

      const $currentTarget = event.currentTarget;
      if (
        dragging.getProps().groupId !==
        dragentered.utils.getNodeProps($currentTarget).groupId
      ) {
        return;
      }

      const dragleave =
        dragentered.utils.getNodeProps($currentTarget).dragleave;
      if (!dragleave) {
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();

      if (
        event.clientX <= rect.left ||
        event.clientX >= rect.right ||
        event.clientY <= rect.top ||
        event.clientY >= rect.bottom
      ) {
        dragleave(event, get(dragging));
      }
    },
  ],
] as const);

export type Parameter = ReturnType<typeof dragentered['getProps']>;

const set = (node: HTMLElement, parameter: Parameter) => {
  dragentered.utils.setNodeProps(node, parameter);
};

export function droppable(
  node: HTMLElement,
  parameter: Parameter | null
): ActionReturn<Parameter> {
  if (parameter === null) {
    return {};
  }

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
