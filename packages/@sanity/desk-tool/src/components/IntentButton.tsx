import {IntentLink} from '@sanity/base/router'
import {Button, ButtonProps} from '@sanity/ui'
import React, {forwardRef, useMemo} from 'react'
import {RouterIntent} from '../types'

export const IntentButton = forwardRef(function IntentButton(
  props: {intent: RouterIntent} & Omit<ButtonProps, 'as' | 'href' | 'type'>,
  ref: React.ForwardedRef<HTMLAnchorElement>
) {
  const {intent, ...restProps} = props

  const Link = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      forwardRef(function Link(
        linkProps: {children: React.ReactNode},
        linkRef: React.ForwardedRef<HTMLAnchorElement>
      ) {
        return (
          <IntentLink {...linkProps} intent={intent.type} params={intent.params} ref={linkRef} />
        )
      }),
    [intent]
  )

  return (
    <Button
      {...restProps}
      as={Link}
      data-as="a"
      ref={ref as React.ForwardedRef<HTMLButtonElement>}
    />
  )
})
