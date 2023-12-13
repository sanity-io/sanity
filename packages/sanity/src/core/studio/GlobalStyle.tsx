/* eslint-disable camelcase */

import {getTheme_v2} from '@sanity/ui/theme'
import {createGlobalStyle, css} from 'styled-components'

const SCROLLBAR_SIZE = 14 // px
const SCROLLBAR_BORDER_SIZE = 4 // px

export const GlobalStyle = createGlobalStyle((props) => {
  const {color, font} = getTheme_v2(props.theme)

  return css`
    ::-webkit-scrollbar {
      width: ${SCROLLBAR_SIZE}px;
      height: ${SCROLLBAR_SIZE}px;
    }

    ::-webkit-scrollbar-thumb {
      background-clip: content-box;
      background-color: ${color.bg};
      border-radius: ${SCROLLBAR_SIZE}px;
      border: ${SCROLLBAR_BORDER_SIZE}px solid transparent;
    }

    ::-webkit-scrollbar-thumb:hover {
      background-color: ${color.muted.fg};
    }

    ::-webkit-scrollbar-track {
      background: transparent;
    }

    html {
      background-color: ${color.bg};
    }

    #sanity {
      font-family: ${font.text.family};
    }

    b {
      font-weight: ${font.text.weights.medium};
    }

    strong {
      font-weight: ${font.text.weights.medium};
    }
  `
})
