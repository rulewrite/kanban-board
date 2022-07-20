import { dragAndDrop, DragEventTargetElement } from './dragAndDrop';

export const arrangeUnit = 65535;
const format = 'text/plain';
const updatePositionEventName = 'updatePosition';

export interface Arrangeable {
  position: number;
}

interface DraggingTarget extends Arrangeable {
  id: number;
}

const mapEventTypeToListener = new Map<string, EventListener>([
  [
    'dragstart',
    (event: DragEventTargetElement) => {
      const { id, position } = event.currentTarget.dataset;

      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData(
        format,
        JSON.stringify({ id: Number(id), position: Number(position) })
      );
    },
  ],
  [
    // 드래그 중인 대상이 적합한 드롭 대상 위에 있을 때 (수백 ms 마다 발생)
    'dragover',
    (event: DragEventTargetElement) => {
      /**
       * https://developer.mozilla.org/ko/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations#droptargets
       * 앱의 대부분의 영역은 적합한 드롭 대상이 아니므로 기본적으로 드롭을 허용하지 않도록 되어있음
       * 따라서 드롭을 허용하려면 기본 처리를 막아야 함.
       */
      event.preventDefault();
      return false;
    },
  ],
  [
    // 드래그 중인 대상을 적합한 드롭 대상에 드롭했을 때
    'drop',
    (event: DragEventTargetElement) => {
      /**
       * https://developer.mozilla.org/ko/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations#drop
       * 웹페지에서 드롭을 수락한 경우 기본 브라우저의 처리도 막아야 함.
       * 예로 링크를 웹페이지로 드래그하면 브라우저가 링크로 리다이렉션 됨.
       */
      event.preventDefault();

      const draggingTarget: DraggingTarget = JSON.parse(
        event.dataTransfer.getData(format)
      );
      const $dropTarget = event.currentTarget;

      const position = Number($dropTarget.dataset.position);
      if (draggingTarget.position === position) {
        return false;
      }

      const isNext = draggingTarget.position < position;
      const sibling = (
        isNext
          ? $dropTarget.nextElementSibling
          : $dropTarget.previousElementSibling
      ) as HTMLElement | null;
      const siblingPosition = sibling ? Number(sibling.dataset.position) : 0;

      $dropTarget.dispatchEvent(
        new CustomEvent(updatePositionEventName, {
          detail: {
            id: draggingTarget.id,
            position: (position + siblingPosition) / 2,
          },
        })
      );

      return false;
    },
  ],
] as const);

interface Parameter extends DraggingTarget {
  updatePosition: EventListener;
}

export function arrange(node: HTMLElement, parameter: Parameter | null) {
  if (parameter === null) {
    return {};
  }

  const { id, position, updatePosition } = parameter;

  node.dataset.id = String(id);
  node.dataset.position = String(position);

  node.addEventListener(updatePositionEventName, updatePosition);
  mapEventTypeToListener.forEach((listener, eventType) => {
    node.addEventListener(eventType, listener);
  });

  const { destroy } = dragAndDrop(node);

  return {
    update({ id, position, updatePosition }: Parameter) {
      node.dataset.id = String(id);
      node.dataset.position = String(position);

      node.removeEventListener(updatePositionEventName, updatePosition);
      node.addEventListener(updatePositionEventName, updatePosition);
    },
    destroy() {
      node.removeEventListener(updatePositionEventName, updatePosition);
      mapEventTypeToListener.forEach((listener, eventType) => {
        node.removeEventListener(eventType, listener);
      });

      destroy();
    },
  };
}
