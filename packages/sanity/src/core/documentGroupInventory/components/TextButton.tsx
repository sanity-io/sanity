import {getTheme_v2 as getThemeV2} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

export const TextButton = styled.button(({theme}) => {
  const {color} = getThemeV2(theme)

  return css`
    all: unset;
    display: inline-block;
    max-inline-size: 100%;
    appearance: none;
    border: 0;
    margin: 0;
    padding: 0;
    outline: none;
    color: ${color.button.ghost.neutral.enabled.fg};

    * {
      color: inherit;
    }

    svg[data-sanity-icon] {
      color: currentColor;
    }
  `
})
