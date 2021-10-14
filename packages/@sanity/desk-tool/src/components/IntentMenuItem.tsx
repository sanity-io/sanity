import {IntentLink} from '@sanity/base/router'
import {MenuItem, MenuItemProps} from '@sanity/ui'
import React, {forwardRef, useMemo} from 'react'
import {RouterIntent} from '../types'

export const IntentMenuItem = forwardRef(function IntentMenuItem(
  props: {intent: RouterIntent} & Omit<MenuItemProps, 'as' | 'href'>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const {intent, ...restProps} = props
  const intentType = intent.type
  const params = useMemo(() => intent.params || {}, [intent.params])

  const Link = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      forwardRef(function Link(
        linkProps: {children: React.ReactNode},
        linkRef: React.ForwardedRef<HTMLAnchorElement>
      ) {
        return <IntentLink {...linkProps} intent={intentType} params={params} ref={linkRef} />
      }),
    [intentType, params]
  )

  return <MenuItem {...restProps} as={Link} data-as="a" ref={ref} />
})
