import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {footer, space3Var, space4Var, space5Var} from './Footer.css'

export function Footer(props: ComponentProps<'div'>) {
  const {className, style, ...rest} = props
  const {space} = useThemeV2()

  return (
    <div
      {...rest}
      className={clsx(footer, className)}
      style={{
        ...assignInlineVars({
          [space3Var]: `${space[3]}px`,
          [space4Var]: `${space[4]}px`,
          [space5Var]: `${space[5]}px`,
        }),
        ...style,
      }}
    />
  )
}
