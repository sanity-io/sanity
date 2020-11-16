import {ColorSchemeKey, Theme} from '@sanity/ui'
import {css, createGlobalStyle} from 'styled-components'

export const GlobalStyle = createGlobalStyle<{scheme: ColorSchemeKey}>(
  ({scheme, theme}: {scheme: ColorSchemeKey; theme: Theme}) => {
    const tone = theme.color[scheme].card.tones.transparent
    const text = theme.fonts.text

    return css`
      #sanityBody {
        background-color: ${tone.enabled.bg};
        color: ${tone.enabled.fg};
        font-family: ${text.family};
        line-height: ${text.sizes[2].lineHeight / text.sizes[2].fontSize};
      }
    `
  }
)
