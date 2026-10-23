import {rem, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps, type CSSProperties} from 'react'

import {
  changeListWrapper,
  diffInspectPaddingSmallVar,
  diffInspectPaddingXSmallVar,
  fieldChangeErrorVar,
  groupChangeContainer,
} from './GroupChange.css'

export function ChangeListWrapper(props: ComponentProps<'div'>) {
  const {className, ...rest} = props

  return <div {...rest} className={clsx(changeListWrapper, className)} />
}

export function GroupChangeContainer(props: ComponentProps<'div'>) {
  const {className, style, ...rest} = props
  const {color, space} = useThemeV2()

  return (
    <div
      {...rest}
      className={clsx(groupChangeContainer, className)}
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
