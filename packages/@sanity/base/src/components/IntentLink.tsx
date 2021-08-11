import React, {ComponentProps} from 'react'
import {IntentLink as RouterIntentLink} from '../router'

/**
 * @beta
 */
export function IntentLink(
  props: Omit<ComponentProps<'a'>, 'href' | 'ref'> & {
    intent: string
    params: Record<string, string>
  }
) {
  return <RouterIntentLink {...props} />
}
