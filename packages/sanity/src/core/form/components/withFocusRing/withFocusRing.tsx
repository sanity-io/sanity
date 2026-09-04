import {rem, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentType, type CSSProperties} from 'react'

import {focusRingBorderStyle, focusRingStyle} from './helpers'
import {borderBoxShadowVar, focusBoxShadowVar, focusRing, radiusVar} from './withFocusRing.css'

/** @internal */
export interface FocusRingProps {
  $border?: boolean
  $radius?: number
  className?: string
  style?: CSSProperties
}

export function withFocusRing<Props>(Component: ComponentType<Props>) {
  return function WithFocusRing(props: Props & FocusRingProps) {
    const {$border, $radius, className, style} = props
    const {card, color, radius} = useThemeV2()

    const border = {width: $border ? 1 : 0, color: 'var(--card-border-color)'}

    // `$border` and `$radius` are transient props (consumed here, never forwarded), as they were
    // for the styled(Component) this wrapper replaces.
    const componentProps: Props & Partial<FocusRingProps> = {...props}
    delete componentProps.$border
    delete componentProps.$radius

    return (
      <Component
        {...componentProps}
        className={clsx(focusRing, className)}
        style={{
          ...assignInlineVars({
            [radiusVar]: `${rem(radius[$radius ?? 1])}`,
            [borderBoxShadowVar]: focusRingBorderStyle(border),
            [focusBoxShadowVar]: focusRingStyle({
              border,
              base: color,
              focusRing: {
                ...card.focusRing,
                // An offset of 0 is needed to avoid the focus ring overlap the border of the inner items, the theme has an offset of -1
                // Detected in empty array items.
                offset: 0,
              },
            }),
          }),
          ...style,
        }}
      />
    )
  }
}
