import {Theme} from '@sanity/ui'
import {ComponentType} from 'react'
import styled, {css, DefaultTheme, StyledComponent} from 'styled-components'

export function withCommandPaletteItemStyles<Props>(
  Component: ComponentType<Props>
): StyledComponent<ComponentType<Props>, DefaultTheme> {
  return styled(Component)(({theme}: {theme: Theme}) => {
    const {color} = theme.sanity
    // Only display `aria-selected` state when a parent element has focus or is currently hovered over (`data-focused` and `data-hovered` respectively).
    return css`
      &[aria-selected='true'] {
        [data-focused='true'] &,
        [data-hovered='true'] & {
          background: ${color.button.bleed.default.hovered.bg};
          // Disable box-shadow to hide the halo effect when we have keyboard focus over a selected <Button>
          box-shadow: none;
        }
      }
    `
  })
}
