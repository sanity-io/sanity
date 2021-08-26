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
  const {intent, params, ...rest} = props

  const routerContext = useContext(RouterContext)

  if (!routerContext) throw new Error('IntentLink: missing context value')

  return <Link {...rest} href={routerContext.resolveIntentLink(intent, params)} ref={ref} />
})

export default IntentLink
