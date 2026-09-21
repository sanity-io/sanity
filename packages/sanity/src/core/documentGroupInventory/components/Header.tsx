import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {header, space4Var, space5Var} from './Header.css'

export function Header(props: ComponentProps<'div'>) {
  const {className, style, ...rest} = props
  const {space} = useThemeV2()

  return (
    <div
      {...rest}
      className={clsx(header, className)}
      style={{
        ...assignInlineVars({
          [space4Var]: `${space[4]}px`,
          [space5Var]: `${space[5]}px`,
        }),
        ...style,
      }}
    />
  )
}
