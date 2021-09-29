import React, {ForwardedRef, forwardRef, useContext} from 'react'
import {RouterContext} from '../RouterContext'
import Link from './Link'
import {IntentParameters} from './types'

interface IntentLinkProps {
  intent: string
  params?: IntentParameters
}

const IntentLink = forwardRef(function IntentLink(
  props: IntentLinkProps & React.HTMLProps<HTMLAnchorElement>,
  ref: ForwardedRef<HTMLAnchorElement>
) {
  const {intent, params, disabled, ...rest} = props

  const routerContext = useContext(RouterContext)

  if (!routerContext) throw new Error('IntentLink: missing context value')

  // We return early because the intent link will be triggered regardless of it being a span if we don't
  if (disabled) {
    return <Link {...rest} disabled ref={ref} />
  }

  return <Link {...rest} href={routerContext.resolveIntentLink(intent, params)} ref={ref} />
})

export default IntentLink
