import { css, injectGlobal } from '@emotion/css';

const draggable = css`
  pointer-events: initial;
  cursor: pointer;
`;

const dragging = css`
  opacity: 0.5;
`;

const dragenter = css`
  border: 5px dashed #ddd;
  box-sizing: border-box;
`;

const draggableSelector = `.${draggable}`;

injectGlobal`
  ${draggableSelector} *:not(${draggableSelector}) {
    pointer-events: none;
  }
`;

export interface DragEventTargetElement extends DragEvent {
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
    },
  ],
  [
    // 드래그가 끝났을 때 (마우스 버튼을 떼거나 ESC 키를 누를 때)
    'dragend',
    (event: DragEventTargetElement) => {
      event.currentTarget.classList.remove(dragging);
    },
  ],
  [
    // 드래그 중인 대상이 적합한 드롭 대상위에 올라갔을 때
    'dragenter',
    (event: DragEventTargetElement) => {
      event.stopPropagation();

      event.currentTarget.classList.add(dragenter);
    },
  ],
  [
    // 드래그 중인 대상이 적합한 드롭 대상에서 벗어났을 때
    'dragleave',
    (event: DragEventTargetElement) => {
      event.currentTarget.classList.remove(dragenter);
    },
  ],
  [
    'drop',
    (event: DragEventTargetElement) => {
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.classList.remove(dragenter);
      return false;
    },
  ],
] as const);

export function dragAndDrop(node: HTMLElement) {
  node.setAttribute('draggable', 'true');
  node.classList.add(draggable);

  mapEventTypeToListener.forEach((listener, eventType) => {
    node.addEventListener(eventType, listener);
  });

  return {
    destroy() {
      mapEventTypeToListener.forEach((listener, eventType) => {
        node.removeEventListener(eventType, listener);
      });
    },
  };
}
