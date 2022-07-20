import OrderedPosition, { Id, Position } from './OrderedPosition';
import { dragenter, draggable, dragging } from './style';

const format = 'text/plain';
const gorupId = Symbol('gorupId');
const orderedPosition = new OrderedPosition();

let currentGroupid: Id = null;

export interface Arrangeable {
  position: Position;
  id: number;
}

interface DragEventTargetElement extends DragEvent {
  target: HTMLElement;
  currentTarget: HTMLElement;
}

const mapEventTypeToListener = new Map<string, EventListener>([
  [
    // 엘리먼트나 텍스트 블록을 드래그하기 시작할 때
    'dragstart',
    (event: DragEventTargetElement) => {
      event.stopPropagation();

      event.currentTarget.classList.add(dragging);

      const { id, position } = event.currentTarget.dataset;
      currentGroupid = event.currentTarget[gorupId];

      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData(
        format,
        JSON.stringify({ id: Number(id), position: Number(position) })
      );
    },
  ],
  [
    // 드래그가 끝났을 때 (마우스 버튼을 떼거나 ESC 키를 누를 때)
    'dragend',
    (event: DragEventTargetElement) => {
      event.stopPropagation();

      event.currentTarget.classList.remove(dragging);
    },
  ],
  [
    // 드래그 중인 대상이 적합한 드롭 대상위에 올라갔을 때
    'dragenter',
    (event: DragEventTargetElement) => {
      event.stopPropagation();

      if (currentGroupid !== event.currentTarget[gorupId]) {
        return;
      }

      event.currentTarget.classList.add(dragenter);
    },
  ],
  [
    // 드래그 중인 대상이 적합한 드롭 대상에서 벗어났을 때
    'dragleave',
    (event: DragEventTargetElement) => {
      event.stopPropagation();

      const rect = event.currentTarget.getBoundingClientRect();

      if (
        event.clientX <= rect.left ||
        event.clientX >= rect.right ||
        event.clientY <= rect.top ||
        event.clientY >= rect.bottom
      ) {
        event.currentTarget.classList.remove(dragenter);
      }
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
      event.stopPropagation();
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
      event.stopPropagation();
      event.currentTarget.classList.remove(dragenter);

      const draggingTarget: Arrangeable = JSON.parse(
        event.dataTransfer.getData(format)
      );
      const $dropTarget = event.currentTarget;

      if (currentGroupid !== $dropTarget[gorupId]) {
        return false;
      }

      const position = Number($dropTarget.dataset.position);
      if (draggingTarget.position === position) {
        return false;
      }

      $dropTarget.dispatchEvent(
        new CustomEvent<UpdatePositionEvent['detail']>('updatePosition', {
          detail: {
            id: draggingTarget.id,
            position: orderedPosition.getBetween(
              currentGroupid,
              draggingTarget.position < position,
              position
            ),
          },
        })
      );

      return false;
    },
  ],
] as const);

interface Parameter extends Arrangeable {
  groupId: Id;
}

export function arrange(node: HTMLElement, parameter: Parameter | null) {
  if (parameter === null) {
    return {};
  }

  node.setAttribute('draggable', 'true');
  node.classList.add(draggable);

  const { id, position, groupId } = parameter;

  node.dataset.id = String(id);
  node.dataset.position = String(position);
  node[gorupId] = groupId;
  orderedPosition.add(groupId, position);

  mapEventTypeToListener.forEach((listener, eventType) => {
    node.addEventListener(eventType, listener);
  });

  return {
    update({ id, position, groupId }: Parameter) {
      node.dataset.id = String(id);
      node.dataset.position = String(position);
      node[gorupId] = groupId;
      orderedPosition.substitution(groupId, parameter.position, position);
    },
    destroy() {
      mapEventTypeToListener.forEach((listener, eventType) => {
        node.removeEventListener(eventType, listener);
      });
    },
  };
}
