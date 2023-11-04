import React, {forwardRef, useMemo} from 'react'
import {PaneMenuItem} from '../types'
import {Button} from '../../ui'
import {IntentLink} from 'sanity/router'

type RouterIntent = NonNullable<PaneMenuItem['intent']>

export const IntentButton = forwardRef(function IntentButton(
  props: {intent: RouterIntent} & Omit<React.ComponentProps<typeof Button>, 'as' | 'href' | 'type'>,
  ref: React.ForwardedRef<HTMLAnchorElement>,
) {
  const {intent, ...restProps} = props

  const Link = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      forwardRef(function Link(
        linkProps: {children: React.ReactNode},
        linkRef: React.ForwardedRef<HTMLAnchorElement>,
      ) {
        return (
          <IntentLink {...linkProps} intent={intent.type} params={intent.params} ref={linkRef} />
        )
      }),
    [intent],
  )

  return props.disabled ? (
    <Button {...props} as="a" role="link" aria-disabled="true" />
  ) : (
    <Button
      {...restProps}
      as={Link}
      data-as="a"
      ref={ref as React.ForwardedRef<HTMLButtonElement>}
    />
  )
})
