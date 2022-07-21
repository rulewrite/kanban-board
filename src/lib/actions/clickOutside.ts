interface MouseEventTargetElement extends MouseEvent {
  target: HTMLElement;
  currentTarget: HTMLElement;
}

export function clickOutside(node: HTMLElement, exceptDataset?: string) {
  const handleClick = (event: MouseEventTargetElement) => {
    if (node.contains(event.target)) {
      return;
    }

    if (exceptDataset && event.target.closest(`[${exceptDataset}]`)) {
      return;
    }

    node.dispatchEvent(new CustomEvent('outClick'));
  };

  document.addEventListener('click', handleClick, true);

  return {
    destroy() {
      document.removeEventListener('click', handleClick, true);
    },
  };
}
