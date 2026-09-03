import {Badge, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {space2Var, statusBadge} from './StatusBadge.css'

export function StatusBadge(props: ComponentProps<typeof Badge>) {
  const {className, style, ...rest} = props
  const {space} = useThemeV2()

  return (
    <Badge
      {...rest}
      className={clsx(statusBadge, className)}
      style={{
        ...assignInlineVars({
          [space2Var]: `${space[2]}px`,
        }),
        ...style,
      }}
    />
  )
}
