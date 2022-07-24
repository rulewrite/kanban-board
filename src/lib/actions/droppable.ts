import { $dragging, groupIdKey } from './arrange/arrange';

const droppableGroupId = Symbol('droppableGroupId');
const dragenterKey = Symbol('dragenter');

const mapEventTypeToListener = new Map<string, EventListener>([
  [
    'dragenter',
    (event: HTMLElementIncludeDragEvent) => {
      event.stopPropagation();

      const $currentTarget = event.currentTarget;
      if ($dragging[groupIdKey] !== $currentTarget[droppableGroupId]) {
        return;
      }

      const dragenter = $currentTarget[dragenterKey];
      if (!dragenter) {
        return;
      }

      dragenter(event, $dragging);
    },
  ],
  [
    'dragover',
    (event: HTMLElementIncludeDragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      return false;
    },
  ],
  [
    'drop',
    (event: HTMLElementIncludeDragEvent) => {
      event.preventDefault();
      event.stopPropagation();

      event.currentTarget.dispatchEvent(
        new CustomEvent<DropEntityEvent['detail']>('dropEntity', {
          detail: { id: Number($dragging.dataset.id) },
        })
      );
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
