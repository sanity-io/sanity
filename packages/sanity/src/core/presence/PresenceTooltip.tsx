import React, {useMemo} from 'react'
import {Flex, Stack, Text, Tooltip} from '@sanity/ui'
import {UserAvatar} from '../components/userAvatar'
import {FormNodePresence} from './types'

interface PresenceTooltipProps {
  children?: React.ReactElement
  items: FormNodePresence[]
}

/**
 * The "documentScrollElement" is being passed to the PortalProvider in DocumentPanel.
 * The default portal element provided by the PortalProvider causes some layout issues with the Tooltip.
 * Therefore, another portal element (i.e. the "documentScrollElement") is being used to solve this.
 */

export function PresenceTooltip(props: PresenceTooltipProps) {
  const {children, items} = props

  const content = useMemo(
    () => (
      <Stack padding={1}>
        {items.map((item) => (
          <Flex align="center" gap={2} padding={1} key={item.user.id}>
            <div>
              <UserAvatar user={item.user} status="online" />
            </div>

            <Text size={1}>{item.user.displayName}</Text>
          </Flex>
        ))}
      </Stack>
    ),
    [items],
  )

  return (
    <Tooltip content={content} placement="top" portal="documentScrollElement">
      {children}
    </Tooltip>
  )
}
