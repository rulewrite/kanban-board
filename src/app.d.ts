interface HTMLElementIncludeDragEvent<T extends HTMLElement> extends DragEvent {
  currentTarget: T;
}

type ChangePositionEvent = CustomEvent<{
  siblingId: number;
  position: number;
}>;

declare namespace svelte.JSX {
  interface HTMLAttributes<T> {
    onoutClick?: () => void;
    onchangePosition?: (e: ChangePositionEvent) => void;
  }
}
