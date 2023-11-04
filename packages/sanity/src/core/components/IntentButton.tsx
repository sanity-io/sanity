import React, {ComponentProps} from 'react'
import {Button} from '../../../src/ui'
import {IntentLink, IntentLinkProps} from 'sanity/router'

/**
 *
 * @hidden
 * @beta
 */
export function IntentButton(props: IntentLinkProps & ComponentProps<typeof Button>) {
  return props.disabled ? (
    <Button {...props} as="a" role="link" aria-disabled="true" />
  ) : (
    <Button {...props} as={IntentLink} />
  )
}
