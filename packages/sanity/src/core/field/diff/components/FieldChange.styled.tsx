import {rem, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {
  diffBorder,
  diffInspectPaddingSmallVar,
  diffInspectPaddingXSmallVar,
  fieldChangeContainer,
  fieldChangeErrorVar,
} from './FieldChange.css'

export function FieldChangeContainer(props: ComponentProps<'div'>) {
  const {className, style, ...rest} = props
  const {color} = useThemeV2()

  return (
    <div
      {...rest}
      className={clsx(fieldChangeContainer, className)}
      style={{
        ...assignInlineVars({[fieldChangeErrorVar]: color.button.default.critical.enabled.bg}),
        ...style,
      }}
    />
  )
}

export function DiffBorder(props: ComponentProps<'div'>) {
  const {className, style, ...rest} = props
  const {color, space} = useThemeV2()

  return (
    <div
      {...rest}
      className={clsx(diffBorder, className)}
      style={{
        ...assignInlineVars({
          [fieldChangeErrorVar]: color.button.default.critical.enabled.bg,
          [diffInspectPaddingXSmallVar]: `${rem(space[1])}`,
          [diffInspectPaddingSmallVar]: `${rem(space[2])}`,
        }),
        ...style,
      }}
    />
  )
}
