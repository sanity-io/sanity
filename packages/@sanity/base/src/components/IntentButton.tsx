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
  return <Button {...props} as={IntentLink} />
}
