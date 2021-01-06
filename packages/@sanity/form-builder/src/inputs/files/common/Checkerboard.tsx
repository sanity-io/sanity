import styled, {css} from 'styled-components'
import {color} from '@sanity/color'

const light = color.gray[50].hex
const dark = color.gray[100].hex

export const Checkerboard = styled.div<{muted?: boolean}>`
  background-color: ${light};
  background-image: linear-gradient(45deg, ${dark} 25%, transparent 25%),
    linear-gradient(-45deg, ${dark} 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, ${dark} 75%),
    linear-gradient(-45deg, transparent 75%, ${dark} 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
  ${(props) =>
    props.muted
      ? css`
          background-image: none;
        `
      : ''};

  }
`
