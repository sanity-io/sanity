import {ThemeColorSchemeKey, Theme} from '@sanity/ui'
import {css, createGlobalStyle} from 'styled-components'

export const GlobalStyle = createGlobalStyle<{scheme: ThemeColorSchemeKey}>(
  ({scheme, theme}: {scheme: ThemeColorSchemeKey; theme: Theme}) => {
    const tone = theme.color[scheme].card.tones.transparent
    const text = theme.fonts.text

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
        background-color: ${tone.enabled.bg};
        color: ${tone.enabled.fg};
        font-family: ${text.family};
        font-size: 100%;
        line-height: ${text.sizes[2].lineHeight / text.sizes[2].fontSize};
        -webkit-font-smoothing: antialiased;
        -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
        margin: 0;
      }
    `
  }
)
