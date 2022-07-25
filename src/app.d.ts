interface HTMLElementIncludeDragEvent<T = {}> extends DragEvent {
  currentTarget: HTMLElement & T;
}

type DropPositionEvent = CustomEvent<{
  siblingId: number;
  position: number;
}>;

type DropEntityEvent = CustomEvent<{
  id: number;
}>;

declare namespace svelte.JSX {
  interface HTMLAttributes<T> {
    onoutClick?: () => void;
    ondropPosition?: (e: DropPositionEvent) => void;
    ondropEntity?: (e: DropEntityEvent) => void;
  }
}
