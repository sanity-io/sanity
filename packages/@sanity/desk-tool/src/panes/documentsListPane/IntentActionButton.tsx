import {Intent, MenuItem as MenuItemType} from '@sanity/base/__legacy/@sanity/components'
import {IntentLink} from '@sanity/base/router'
import {Box, Button, Text, Tooltip} from '@sanity/ui'
import React, {forwardRef, useMemo} from 'react'

export function IntentActionButton(props: {intent: Intent; item: MenuItemType}) {
  const {intent, item} = props

  const Link = useMemo(
    () =>
      // eslint-disable-next-line no-shadow
      forwardRef(function Link(
        linkProps: {children: React.ReactNode},
        ref: React.ForwardedRef<HTMLAnchorElement>
      ) {
        const {children, ...restProps} = linkProps

        return (
          <IntentLink {...restProps} intent={intent.type} params={intent.params} ref={ref}>
            {children}
          </IntentLink>
        )
      }),
    [intent]
  )

  return (
    <Tooltip
      content={
        <Box padding={2}>
          <Text muted size={1}>
            {item.title}
          </Text>
        </Box>
      }
      disabled={!item.title}
      placement="bottom"
    >
      <Button
        aria-label={String(item.title)}
        as={Link}
        data-as="a"
        icon={item.icon}
        mode="bleed"
        padding={3}
      />
    </Tooltip>
  )
}
