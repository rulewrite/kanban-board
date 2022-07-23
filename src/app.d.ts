interface HTMLElementIncludeDragEvent extends DragEvent {
  target: HTMLElement;
  currentTarget: HTMLElement;
}

type DropPositionEvent = CustomEvent<{
  siblingId: number;
  position: number;
}>;

declare namespace svelte.JSX {
  interface HTMLAttributes<T> {
    onoutClick?: () => void;
    ondropPosition?: (e: DropPositionEvent) => void;
  }
}
