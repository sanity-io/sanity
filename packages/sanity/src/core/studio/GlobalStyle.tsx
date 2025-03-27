/* eslint-disable camelcase */

import {getTheme_v2, rgba} from '@sanity/ui/theme'
import {createGlobalStyle, css} from 'styled-components'

export const GlobalStyle = createGlobalStyle((props) => {
  const {color, font} = getTheme_v2(props.theme)

  return css`
    *::selection {
      background-color: ${rgba(color.focusRing, 0.3)};
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
