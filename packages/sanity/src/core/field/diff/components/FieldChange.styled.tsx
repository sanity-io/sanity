import {rem, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps, type CSSProperties} from 'react'

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
      style={
        {
          [fieldChangeErrorVar]: color.button.default.critical.enabled.bg,
          ...style,
        } as CSSProperties
      }
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
      style={
        {
          [fieldChangeErrorVar]: color.button.default.critical.enabled.bg,
          [diffInspectPaddingXSmallVar]: `${rem(space[1])}`,
          [diffInspectPaddingSmallVar]: `${rem(space[2])}`,
          ...style,
        } as CSSProperties
      }
    />
  )
}
