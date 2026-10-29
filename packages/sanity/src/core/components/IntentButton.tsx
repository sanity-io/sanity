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
  // The disabled state renders a plain anchor, so the IntentLink-only props must not reach the DOM.
  const {intent, params, replace, searchParams, ...buttonProps} = props
  const intentProps: IntentLinkProps = {intent, params, replace, searchParams}

  return buttonProps.disabled ? (
    <Button {...buttonProps} as="a" role="link" aria-disabled="true" />
  ) : (
    <Button {...buttonProps} {...intentProps} as={IntentLink} />
  )
}
