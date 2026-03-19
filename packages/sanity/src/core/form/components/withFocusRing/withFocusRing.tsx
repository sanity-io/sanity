import {rem, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {type ComponentType, forwardRef} from 'react'

import {focusRingBorderStyle, focusRingStyle} from './helpers'
import {borderRadiusVar, boxShadowVar, focusBoxShadowVar, focusRingClass} from './withFocusRing.css'

export function withFocusRing<Props extends {className?: string; style?: React.CSSProperties}>(
  component: ComponentType<Props>,
) {
  const WrappedComponent = forwardRef<unknown, Props & {$border?: boolean; $radius?: number}>(
    (props, ref) => {
      const {$border, $radius, ...rest} = props as any
      const {card, color, radius} = useThemeV2()

      const border = {width: $border ? 1 : 0, color: 'var(--card-border-color)'}

      const Component = component as any
      return (
        <Component
          {...rest}
          ref={ref}
          className={`${focusRingClass}${rest.className ? ` ${rest.className}` : ''}`}
          style={{
            ...rest.style,
            [borderRadiusVar]: rem(radius[$radius ?? 1]),
            [boxShadowVar]: focusRingBorderStyle(border),
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
          }}
        />
      )
    },
  )
  WrappedComponent.displayName = `withFocusRing(${(component as any).displayName || (component as any).name || 'Component'})`
  return WrappedComponent
}
