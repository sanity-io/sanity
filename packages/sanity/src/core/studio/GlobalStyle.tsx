/* eslint-disable camelcase */

import {getTheme_v2, rgba} from '@sanity/ui/theme'
import {createGlobalStyle, css} from 'styled-components'

const SCROLLBAR_SIZE = 12 // px
const SCROLLBAR_BORDER_SIZE = 4 // px

// Construct a resize handle icon as a data URI, to be displayed in browsers that support the `::-webkit-resizer` selector.
function buildResizeHandleDataUri(hexColor: string) {
  const encodedStrokeColor = encodeURIComponent(hexColor)
  const encodedSvg = `%3Csvg width='9' height='9' viewBox='0 0 9 9' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 8L8 1' stroke='${encodedStrokeColor}' stroke-linecap='round'/%3E%3Cpath d='M5 8L8 5' stroke='${encodedStrokeColor}' stroke-linecap='round'/%3E%3C/svg%3E%0A`
  return `url("data:image/svg+xml,${encodedSvg}")`
}

export const GlobalStyle = createGlobalStyle((props) => {
  const {color, font} = getTheme_v2(props.theme)

  return css`
    ::-webkit-resizer {
      background-image: ${buildResizeHandleDataUri(color.icon)};
      background-repeat: no-repeat;
      background-position: bottom right;
    }

    ::-webkit-scrollbar {
      width: ${SCROLLBAR_SIZE}px;
      height: ${SCROLLBAR_SIZE}px;
    }

    ::-webkit-scrollbar-corner {
      background-color: transparent;
    }

    ::-webkit-scrollbar-thumb {
      background-clip: content-box;
      background-color: var(--card-border-color, ${color.border});
      border: ${SCROLLBAR_BORDER_SIZE}px solid transparent;
    }

    ::-webkit-scrollbar-thumb:hover {
      background-color: var(--card-muted-fg-color, ${color.muted.fg});
    }

    ::-webkit-scrollbar-track {
      background: transparent;
    }

    *::selection {
      background-color: ${rgba(color.focusRing, 0.3)};
    }

    html {
      background-color: ${color.bg};
    }

    body {
      scrollbar-gutter: stable;
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
