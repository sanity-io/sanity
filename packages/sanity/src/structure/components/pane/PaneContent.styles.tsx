import {Card} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps, type ElementType} from 'react'

import {root} from './PaneContent.styles.css'

export function Root(
  props: ComponentProps<typeof Card> & {
    /** Kept from the previous styled API: `PaneContent` uses it to pick the rendered element */
    forwardedAs?: ElementType
  },
) {
  const {className, forwardedAs, ...rest} = props
  return <Card as={forwardedAs} {...rest} className={clsx(root, className)} />
}
