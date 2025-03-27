import {type ForwardedRef, forwardRef, useMemo} from 'react'
import {IntentLink} from 'sanity/router'

import {Button, type ButtonProps} from '../../ui-components'
import {type PaneMenuItem} from '../types'

type RouterIntent = NonNullable<PaneMenuItem['intent']>

export const IntentButton = forwardRef(function IntentButton(
  props: {disabled?: boolean; intent: RouterIntent} & ButtonProps<'a'>,
  ref: ForwardedRef<HTMLAnchorElement>,
) {
  const {intent, ...restProps} = props

  // restProps.disabled

  const Link = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      forwardRef(function Link(
        linkProps: React.ComponentProps<'a'>,
        linkRef: ForwardedRef<HTMLAnchorElement>,
      ) {
        return (
          <IntentLink
            {...linkProps}
            intent={intent.type}
            params={intent.params}
            ref={linkRef}
            searchParams={intent.searchParams}
          />
        )
      }),
    [intent],
  )

  return props.disabled ? (
    <Button {...restProps} as="a" role="link" aria-disabled="true" />
  ) : (
    <Button {...restProps} as={Link} data-as="a" ref={ref} />
  )
})
