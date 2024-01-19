import {HTMLProps} from 'react'
import {Button, ButtonProps} from '../../ui-components'

import {IntentLink, IntentLinkProps} from 'sanity/router'

/**
 *
 * @hidden
 * @beta
 */
export function IntentButton(
  props: IntentLinkProps & ButtonProps & Omit<HTMLProps<HTMLButtonElement>, 'ref' | 'size' | 'as'>,
) {
  return props.disabled ? (
    <Button {...props} as="a" role="link" aria-disabled="true" />
  ) : (
    <Button {...props} as={IntentLink} />
  )
}
