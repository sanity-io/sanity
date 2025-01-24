import {type ComponentProps, type ForwardedRef, forwardRef, type ReactNode, useMemo} from 'react'
import {IntentLink} from 'sanity/router'

import {Button, type ButtonProps} from '../../ui-components'
import {type PaneMenuItem} from '../types'

type RouterIntent = NonNullable<PaneMenuItem['intent']>

export const IntentButton = forwardRef(function IntentButton(
  props: {
    intent: RouterIntent
  } & ButtonProps &
    Omit<ComponentProps<typeof Button>, 'as' | 'href' | 'type'>,
  ref: ForwardedRef<HTMLAnchorElement>,
) {
  const {intent, ...restProps} = props

  const Link = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      forwardRef(function Link(
        linkProps: {children: ReactNode},
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
    <Button {...restProps} as={Link} data-as="a" ref={ref as ForwardedRef<HTMLButtonElement>} />
  )
})
