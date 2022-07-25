interface HTMLElementIncludeDragEvent extends DragEvent {
  currentTarget: HTMLElement;
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
