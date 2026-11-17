import {Card} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {transparentCard} from './TransparentCard.css'

/**
 * Returns a `<Card>` without a background.
 * This is a temporary workaround to force nested Sanity UI components to adhere to a specific tone (and bypass color mixing).
 *
 * TODO: consider exposing an unstable prop in Sanity UI to facilitate this.
 */
export function TransparentCard(props: ComponentProps<typeof Card>) {
  const {className, ...rest} = props

  return <Card {...rest} className={clsx(transparentCard, className)} />
}
