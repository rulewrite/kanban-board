type UpdatePositionEvent = CustomEvent<{
  id: number;
  position: number;
}>;

declare namespace svelte.JSX {
  interface HTMLAttributes<T> {
    onoutclick?: () => void;
    onupdatePosition?: (e: UpdatePositionEvent) => void;
  }
}
