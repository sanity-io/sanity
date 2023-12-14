import styled, {css} from 'styled-components'
import {rem, Theme} from '@sanity/ui'
import {ComponentType} from 'react'
import {focusRingBorderStyle, focusRingStyle} from './helpers'

export function withFocusRing<Props>(component: ComponentType<Props>) {
  return styled(component)<Props & {$border?: boolean}>(
    (props: {theme: Theme; $border?: boolean}) => {
      const border = {width: props.$border ? 1 : 0, color: 'var(--card-border-color)'}
      return css`
        --card-focus-box-shadow: ${focusRingBorderStyle(border)};

        border-radius: ${rem(props.theme.sanity.v2?.radius[1] ?? props.theme.sanity.radius[1])};
        outline: none;
        box-shadow: var(--card-focus-box-shadow);

        &:focus {
          --card-focus-box-shadow: ${focusRingStyle({
            border,
            base: {bg: props.theme.sanity.v2?.color.bg ?? props.theme.sanity.color.base.bg},
            focusRing: {
              // An offset of 0 is needed to avoid the focus ring overlap the border of the inner items, the theme has an offset of -1
              // Detected in empty array items.
              offset: 0,
              width:
                props.theme.sanity.v2?.card.focusRing.width ?? props.theme.sanity.focusRing.width,
            },
          })};
        }
      `
    },
  )
}
