import { css } from '@emotion/css';

export const draggable = css`
  cursor: pointer;
`;

export const dragging = css`
  opacity: 0.5;
  position: relative;
  overflow: hidden;
  border-radius: 5px;

  ::after {
    content: '';
    position: absolute;
    z-index: 3;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: #ccc;
  }
`;
