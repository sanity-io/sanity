import {Layer, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {focusRingBorderStyle, focusRingStyle} from '../../components/withFocusRing/helpers'
import {
  expandedLayer,
  inputBorderBoxShadowVar,
  inputBorderWidthVar,
  inputFocusRingBoxShadowVar,
  radius2Var,
  root,
  stringDiffContainer,
} from './Compositor.styles.css'

export function Root(props: ComponentProps<'div'>) {
  const {className, style, ...rest} = props
  const {color, input, radius} = useThemeV2()

  const border = {
    color: color.input.default.enabled.border,
    width: input.border.width,
  }

  return (
    <div
      {...rest}
      className={clsx(root, className)}
      style={{
        ...assignInlineVars({
          [inputBorderBoxShadowVar]: focusRingBorderStyle(border),
          [inputFocusRingBoxShadowVar]: focusRingStyle({
            base: color,
            border,
            focusRing: input.text.focusRing,
          }),
          [inputBorderWidthVar]: `${input.border.width}px`,
          [radius2Var]: `${radius[2]}px`,
        }),
        ...style,
      }}
    />
  )
}

// This element only wraps the input when in "fullscreen" mode
export function ExpandedLayer(props: ComponentProps<typeof Layer>) {
  const {className, ...rest} = props
  return <Layer {...rest} className={clsx(expandedLayer, className)} />
}

export function StringDiffContainer(props: ComponentProps<'div'>) {
  const {className, ...rest} = props
  return <div {...rest} className={clsx(stringDiffContainer, className)} />
}
