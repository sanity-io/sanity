import React, {ForwardedRef, forwardRef} from 'react'
import {IntentParameters} from './types'
import {useIntentLink} from './useIntentLink'

/**
 * @public
 */
export interface IntentLinkProps {
  intent: string
  params?: IntentParameters
  replace?: boolean
}

/**
 * @public
 */
export const IntentLink = forwardRef(function IntentLink(
  props: IntentLinkProps & React.HTMLProps<HTMLAnchorElement>,
  ref: ForwardedRef<HTMLAnchorElement>
) {
  const {intent, params, target, ...restProps} = props
  const {handleClick, href} = useIntentLink({intent, params, target, onClick: props.onClick})

  return <a {...restProps} href={href} onClick={handleClick} ref={ref} />
})
