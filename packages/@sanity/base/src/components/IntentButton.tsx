import React, {ComponentProps} from 'react'
import {Button} from '@sanity/ui'
import {IntentLink} from './IntentLink'

/**
 * @beta
 */
export function IntentButton(
  props: Omit<ComponentProps<typeof Button> & ComponentProps<typeof IntentLink>, 'as' | 'href'> & {
    intent: string
    params: Record<string, string>
  }
) {
  return props.disabled ? (
    <Button {...props} as="a" role="link" aria-disabled="true" />
  ) : (
    <Button {...props} as={IntentLink} />
  )
}
