import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps, type CSSProperties} from 'react'

import {body, space4Var, space5Var} from './Body.css'

export function Body(props: ComponentProps<'div'>) {
  const {className, style, ...rest} = props
  const {space} = useThemeV2()

  return (
    <div
      {...rest}
      className={clsx(body, className)}
      style={
        {
          [space4Var]: `${space[4]}px`,
          [space5Var]: `${space[5]}px`,
          ...style,
        } as CSSProperties
      }
    />
  )
}
