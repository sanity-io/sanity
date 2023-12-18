import React from 'react'
import {Button, ButtonProps} from '../../../src/ui'

import {IntentLink, IntentLinkProps} from 'sanity/router'

/**
 *
 * @hidden
 * @beta
 */
export function IntentButton(
  props: IntentLinkProps &
    ButtonProps &
    Omit<React.HTMLProps<HTMLButtonElement>, 'ref' | 'size' | 'as'>,
) {
  return props.disabled ? (
    <Button {...props} as="a" role="link" aria-disabled="true" />
  ) : (
    <Button {...props} as={IntentLink} />
  )
}
