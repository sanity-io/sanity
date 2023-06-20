import {Button, ButtonProps} from '@sanity/ui'
import React, {HTMLProps} from 'react'
import {IntentLink, IntentLinkProps} from 'sanity/router'

/**
 *
 * @hidden
 * @beta
 */
export function IntentButton(
  props: IntentLinkProps & ButtonProps & Omit<HTMLProps<HTMLButtonElement>, 'as' | 'href' | 'ref'>
) {
  return props.disabled ? (
    <Button {...props} as="a" role="link" aria-disabled="true" />
  ) : (
    <Button {...props} as={IntentLink} />
  )
}
