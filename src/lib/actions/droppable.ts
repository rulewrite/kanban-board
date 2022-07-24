import { $dragging, groupIdKey } from './draggable';

const droppableGroupId = Symbol('droppableGroupId');
const dragenterKey = Symbol('dragenter');
export const dropEntityEventType = 'dropEntity';

let $dragenter: HTMLElement = null;

// 드래그 중인 대상이 적합한 드롭 대상 위에 있을 때 (수백 ms 마다 발생)
document.addEventListener('dragover', (event: HTMLElementIncludeDragEvent) => {
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
document.addEventListener('drop', (event: HTMLElementIncludeDragEvent) => {
  /**
   * https://developer.mozilla.org/ko/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations#drop
   * 웹페지에서 드롭을 수락한 경우 기본 브라우저의 처리도 막아야 함.
   * 예로 링크를 웹페이지로 드래그하면 브라우저가 링크로 리다이렉션 됨.
   */
  event.preventDefault();
  event.stopPropagation();

  if (!$dragenter) {
    return;
  }

  if ($dragging[groupIdKey] !== $dragenter[droppableGroupId]) {
    return;
  }

  $dragenter.dispatchEvent(
    new CustomEvent<DropEntityEvent['detail']>(dropEntityEventType, {
      detail: { id: Number($dragging.dataset.id) },
    })
  );
});

const mapEventTypeToListener = new Map<string, EventListener>([
  [
    // 드래그 중인 대상이 적합한 드롭 대상위에 올라갔을 때
    'dragenter',
    (event: HTMLElementIncludeDragEvent) => {
      event.stopPropagation();

      const $currentTarget = event.currentTarget;
      if ($dragging[groupIdKey] !== $currentTarget[droppableGroupId]) {
        return;
      }

      $dragenter = $currentTarget;
      const dragenter = $currentTarget[dragenterKey];
      if (!dragenter) {
        return;
      }

      dragenter(event, $dragging);
    },
  ],
] as const);

export interface Parameter {
  groupId: Symbol;
  dragenter?: (e: HTMLElementIncludeDragEvent, $dragging: HTMLElement) => void;
}

const set = (node: HTMLElement, { groupId, dragenter }: Parameter) => {
  node[droppableGroupId] = groupId;
  dragenter ? (node[dragenterKey] = dragenter) : delete node[dragenterKey];
};

export function droppable(node: HTMLElement, parameter: Parameter | null) {
  if (parameter === null) {
    return {};
  }

  set(node, parameter);
  mapEventTypeToListener.forEach((listener, eventType) => {
    node.addEventListener(eventType, listener);
  });

  return {
    update(updatedParameter: Parameter) {
      set(node, updatedParameter);
    },
    destroy() {
      mapEventTypeToListener.forEach((listener, eventType) => {
        node.removeEventListener(eventType, listener);
      });
    },
  };
}
