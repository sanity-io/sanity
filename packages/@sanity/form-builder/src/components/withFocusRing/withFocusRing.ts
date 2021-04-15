import styled, {css} from 'styled-components'
import {rem, Theme} from '@sanity/ui'
import {ComponentType} from 'react'
import {focusRingBorderStyle, focusRingStyle} from './helpers'

export function withFocusRing<Props>(component: ComponentType<Props>) {
  return styled(component)(({theme}: {theme: Theme}) => {
    const border = {width: 1, color: 'var(--card-border-color)'}

    return css`
      --card-focus-box-shadow: ${focusRingBorderStyle(border)};

      border-radius: ${rem(theme.sanity.radius[1])};
      outline: none;
      box-shadow: var(--card-focus-box-shadow);

      &:focus {
        --card-focus-box-shadow: ${focusRingStyle({
          base: theme.sanity.color.base,
          border,
          focusRing: theme.sanity.focusRing,
        })};
      }
    `
  })
}
