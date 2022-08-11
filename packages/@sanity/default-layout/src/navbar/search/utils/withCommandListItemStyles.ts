import {Theme} from '@sanity/ui'
import {ComponentType} from 'react'
import styled, {css, DefaultTheme, StyledComponent} from 'styled-components'

export function withCommandListItemStyles<Props>(
  Component: ComponentType<Props>
): StyledComponent<ComponentType<Props>, DefaultTheme> {
  return styled(Component)(({theme}: {theme: Theme}) => {
    const {color} = theme.sanity
    /**
     * Display active state when:
     * 1. This element (or its parent) has `aria-selected=true` AND
     * 2. A parent element has focus or is currently hovered over (`data-focused` and `data-hovered` respectively).
     */
    return css`
      &[aria-selected='true'],
      [aria-selected='true'] & {
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
