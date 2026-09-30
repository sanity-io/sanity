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
  if (props.disabled) {
    // A disabled button renders a plain anchor, so the intent props have nothing to consume them
    // and would otherwise end up as `intent="…"` / `params="[object Object]"` DOM attributes.
    const {
      intent: _intent,
      params: _params,
      replace: _replace,
      searchParams: _searchParams,
      ...rest
    } = props
    return <Button {...rest} as="a" role="link" aria-disabled="true" />
  }

  return <Button {...props} as={IntentLink} />
}
