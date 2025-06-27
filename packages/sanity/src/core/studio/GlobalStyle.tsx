import {vars} from '@sanity/ui/css'
import {createGlobalStyle, css} from 'styled-components'

export const GlobalStyle = createGlobalStyle(() => {
  return css`
    *::selection {
      background-color: color-mix(in srgb, transparent, ${vars.color.focusRing} 30%);
    }

    body {
      scrollbar-gutter: stable;
    }

    #sanity {
      font-family: ${vars.font.text.family};
    }

    b {
      font-weight: ${vars.font.text.weight.medium};
    }

    strong {
      font-weight: ${vars.font.text.weight.medium};
    }
  `
})
