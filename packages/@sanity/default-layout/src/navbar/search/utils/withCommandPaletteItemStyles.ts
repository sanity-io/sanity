import {Theme} from '@sanity/ui'
import {ComponentType} from 'react'
import styled, {css, DefaultTheme, StyledComponent} from 'styled-components'

export function withCommandPaletteItemStyles<Props>(
  Component: ComponentType<Props>
): StyledComponent<ComponentType<Props>, DefaultTheme> {
  return styled(Component)(({theme}: {theme: Theme}) => {
    const {color} = theme.sanity
    return css`
      &[aria-selected='true'] {
        background: ${color.button.bleed.default.hovered.bg};
        // Disable box-shadow to hide the halo effect when we have keyboard focus over a selected <Button>
        box-shadow: none;
      }
    `
  })
}
