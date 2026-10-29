import {css, styled} from 'styled-components'

export const Body = styled.div(() => {
  return css`
    flex: 1 1 auto;
    min-block-size: 0;
    overflow-x: clip;
    overflow-y: auto;
    overscroll-behavior: contain;

    @property --end-mask-color {
      syntax: '<color>';
      inherits: false;
      initial-value: #000;
    }

    @keyframes fade-mask {
      0% {
        --end-mask-color: transparent;
      }
      2%,
      98% {
        --end-mask-color: transparent;
      }
      100% {
        --end-mask-color: #000;
      }
    }

    --mask-size: 3rem;

    mask-image: linear-gradient(
      #000 var(--mask-size),
      #000 calc(100% - var(--mask-size)),
      var(--end-mask-color)
    );

    mask-position: 0% 0%;
    mask-repeat: no-repeat;
    mask-size: 100% 100%;
    animation: fade-mask;
    animation-timeline: scroll(self y);
  `
})
