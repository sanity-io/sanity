import React, {ComponentProps} from 'react'
import {Button} from '@sanity/ui'
import {IntentLink} from './IntentLink'

export function IntentButton(
  props: Omit<ComponentProps<typeof Button>, 'as' | 'href'> & {
    intent: string
    params: Record<string, string>
  }
) {
  return <Button {...props} as={IntentLink} />
}
