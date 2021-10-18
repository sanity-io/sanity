import {IntentLink} from '@sanity/base/router'
import {MenuItem, MenuItemProps} from '@sanity/ui'
import React, {forwardRef, useMemo} from 'react'
import {PaneMenuItem} from '../types'

type RouterIntent = NonNullable<PaneMenuItem['intent']>

export const IntentMenuItem = forwardRef(function IntentMenuItem(
  props: {intent: RouterIntent; disabled: boolean} & Omit<MenuItemProps, 'as' | 'href'>,
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

  return props.disabled ? (
    <MenuItem {...restProps} as="a" data-as="as" aria-disabled="true" />
  ) : (
    <MenuItem {...restProps} as={Link} data-as="a" ref={ref} />
  )
})
