import {type HTMLProps} from 'react'
import {IntentLink, type IntentLinkProps} from 'sanity/router'

import {Button, type ButtonProps} from '../../ui-components/button/Button'

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
