import {rem, Text, type TextProps, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {
  mediaSpan,
  mediaSpanRadiusVar,
  rootSpan,
  textSpan,
  textSpanFontSizeVar,
  textSpanFontWeightVar,
  textSpanLineHeightVar,
} from './InlinePreview.css'

export function RootSpan(props: ComponentProps<'span'>) {
  const {className, ...rest} = props
  return <span {...rest} className={clsx(rootSpan, className)} />
}

export function MediaSpan(props: ComponentProps<'span'>) {
  const {className, style, ...rest} = props
  const {radius} = useThemeV2()

  return (
    <span
      {...rest}
      className={clsx(mediaSpan, className)}
      style={{...assignInlineVars({[mediaSpanRadiusVar]: `${rem(radius[1])}`}), ...style}}
    />
  )
}

export function TextSpan(props: Omit<TextProps<'span'>, 'as'>) {
  const {className, style, ...rest} = props
  const {font} = useThemeV2()
  const textFont = font.text
  const textSize = textFont.sizes[1]

  return (
    <Text
      {...rest}
      as="span"
      className={clsx(textSpan, className)}
      style={{
        ...assignInlineVars({
          [textSpanFontSizeVar]: `${textSize.fontSize}`,
          [textSpanFontWeightVar]: `${textFont.weights.medium}`,
          [textSpanLineHeightVar]: `${textSize.lineHeight / textSize.fontSize}`,
        }),
        ...style,
      }}
    />
  )
}
