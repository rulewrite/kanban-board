import { css, injectGlobal } from '@emotion/css';

export const draggable = css`
  pointer-events: initial;
  cursor: pointer;
`;

export const dragging = css`
  opacity: 0.5;
`;

export const dragenter = css`
  border: 5px dashed #ddd;
  box-sizing: border-box;
`;

const draggableSelector = `.${draggable}`;

injectGlobal`
${draggableSelector} *:not(${draggableSelector}) {
  pointer-events: none;
}
`;
