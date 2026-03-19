import {Card, type CardProps} from '@sanity/ui'
import {forwardRef} from 'react'

import {transparentCard} from './TransparentCard.css'

/**
 * Returns a Card without a background.
 * This is a temporary workaround to force nested Sanity UI components to adhere to a specific tone (and bypass color mixing).
 *
 * TODO: consider exposing an unstable prop in Sanity UI to facilitate this.
 */
export const TransparentCard = forwardRef<HTMLDivElement, CardProps>(
  function TransparentCard(props, ref) {
    const {className, ...rest} = props
    return (
      <Card
        {...rest}
        className={[transparentCard, className].filter(Boolean).join(' ')}
        ref={ref}
      />
    )
  },
)
