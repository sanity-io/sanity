import {Theme} from '@sanity/ui'
import {ComponentType} from 'react'
import styled, {css, DefaultTheme, StyledComponent} from 'styled-components'

export function withCommandPaletteItemStyles<Props>(
  Component: ComponentType<Props>
): StyledComponent<ComponentType<Props>, DefaultTheme> {
  return styled(Component)(({theme}: {theme: Theme}) => {
    const {color} = theme.sanity
    // TODO: use idiomatic sanity/ui styling, double check usage of `bg2`
    return css`
      &[aria-selected='true'] {
        background: ${color.button.bleed.default.hovered.bg2};
        // Disable box-shadow to hide the the halo effect when we have keyboard focus over a selected <Button>
        // TODO: see if there's a better way to address this
        box-shadow: none;
      }
    `
  })
}
