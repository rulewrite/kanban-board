interface MouseEventTargetElement extends MouseEvent {
  target: HTMLElement;
  currentTarget: HTMLElement;
}

export function clickOutside(node: HTMLElement) {
  const handleClick = (event: MouseEventTargetElement) => {
    if (node.contains(event.target)) {
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
