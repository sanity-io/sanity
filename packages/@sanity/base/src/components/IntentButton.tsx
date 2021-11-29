import type {ComponentProps} from 'react'
import React from 'react'
import {Button} from '@sanity/ui'
import {IntentLink} from './IntentLink'
/**
 * @beta
 */
export function IntentButton(
  props: Omit<ComponentProps<typeof Button> & ComponentProps<typeof IntentLink>, 'as' | 'href'> & {
    intent: string
    params: Record<string, any> | [Record<string, any>, Record<string, any>]
  }
) {
  return props.disabled ? (
    <Button {...props} as="a" role="link" aria-disabled="true" />
  ) : (
    <Button {...props} as={IntentLink} />
  )
}
