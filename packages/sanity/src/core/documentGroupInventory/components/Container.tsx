import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {container, container0Var, space3Var} from './Container.css'

export function Container(props: ComponentProps<'div'>) {
  const {className, style, ...rest} = props
  const {container: containerSizes, space} = useThemeV2()

  return (
    <div
      {...rest}
      className={clsx(container, className)}
      style={{
        ...assignInlineVars({
          [container0Var]: `${containerSizes[0]}px`,
          [space3Var]: `${space[3]}px`,
        }),
        ...style,
      }}
    />
  )
}
