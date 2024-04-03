/* eslint-disable camelcase */

import {rem, type Theme} from '@sanity/ui'
import {getTheme_v2} from '@sanity/ui/theme'
import {type ComponentType} from 'react'
import {css, styled} from 'styled-components'

import {focusRingBorderStyle, focusRingStyle} from './helpers'

export function withFocusRing<Props>(component: ComponentType<Props>) {
  return styled(component)<Props & {$border?: boolean; $radius?: number}>(
    (props: {theme: Theme; $border?: boolean; $radius?: number}) => {
      const {$border, $radius} = props
      const {card, color, radius} = getTheme_v2(props.theme)

      const border = {width: $border ? 1 : 0, color: 'var(--card-border-color)'}

      return css`
        --card-focus-box-shadow: ${focusRingBorderStyle(border)};

        border-radius: ${rem(radius[$radius ?? 1])};
        outline: none;
        box-shadow: var(--card-focus-box-shadow);

        &:focus {
          --card-focus-box-shadow: ${focusRingStyle({
            border,
            base: color,
            focusRing: {
              ...card.focusRing,
              // An offset of 0 is needed to avoid the focus ring overlap the border of the inner items, the theme has an offset of -1
              // Detected in empty array items.
              offset: 0,
            },
          })};
        }
      `
    },
  )
}
