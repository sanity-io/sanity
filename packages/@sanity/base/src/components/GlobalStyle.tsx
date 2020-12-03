import {Theme} from '@sanity/ui'
import {css, createGlobalStyle} from 'styled-components'

export const GlobalStyle = createGlobalStyle(({theme}: {theme: Theme}) => {
  const color = theme.sanity.color.base
  const font = theme.sanity.fonts.text

  return css`
    html,
    #sanityBody,
    #sanity {
      height: 100%;
    }

    /* ::selection {
        background: var(--text-selection-color);
      } */

    #sanityBody {
      background-color: ${color.bg};
      color: ${color.fg};
      font-family: ${font.family};
      font-size: 100%;
      line-height: ${font.sizes[2].lineHeight / font.sizes[2].fontSize};
      -webkit-font-smoothing: antialiased;
      -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
      margin: 0;
    }
  `
})
