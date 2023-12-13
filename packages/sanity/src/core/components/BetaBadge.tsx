import {HTMLProps} from 'react'
import {Badge, BadgeProps} from '@sanity/ui'

/** @internal */
export type BetaBadgeProps = Omit<BadgeProps, 'mode' | 'tone'>

/** @internal */
export function BetaBadge(props: BetaBadgeProps & Omit<HTMLProps<HTMLDivElement>, 'ref'>) {
  const {fontSize = 1, children = 'Beta', ...rest} = props

  return (
    <Badge {...rest} fontSize={fontSize} radius={2} tone="primary">
      {children}
    </Badge>
  )
}
