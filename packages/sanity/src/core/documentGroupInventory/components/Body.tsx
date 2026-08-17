import {getTheme_v2 as getThemeV2} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

export const Body = styled.div(({theme}) => {
  const {space} = getThemeV2(theme)

  return css`
    overflow-x: clip;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: calc(${space[5]}px * 0.5) calc(${space[4]}px);

    @property --start-mask-color {
      syntax: '<color>';
      inherits: false;
      initial-value: #000;
    }

    @property --end-mask-color {
      syntax: '<color>';
      inherits: false;
      initial-value: #000;
    }

    @keyframes fade-mask {
      0% {
        --start-mask-color: #000;
        --end-mask-color: transparent;
      }
      2%,
      98% {
        --start-mask-color: transparent;
        --end-mask-color: transparent;
      }
      100% {
        --start-mask-color: transparent;
        --end-mask-color: #000;
      }
    }

    --mask-size: 3rem;

    mask-image: linear-gradient(
      to var(--direction, bottom),
      var(--start-mask-color),
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
