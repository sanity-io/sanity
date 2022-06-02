import React, {useMemo} from 'react'
import {Box, Flex, Tooltip} from '@sanity/ui'
import {UserAvatar} from '../components/UserAvatar'
import {NodePresence} from '../form'
import {TextWrapper} from './PresenceTooltip.styled'

interface PresenceTooltipProps {
  children?: React.ReactElement
  items: NodePresence[]
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
      <Box padding={1}>
        {items.map((item) => (
          <Box key={item.user.id} padding={1}>
            <Flex align="center">
              <div>
                <UserAvatar user={item.user} status="online" />
              </div>

              <TextWrapper>{item.user.displayName}</TextWrapper>
            </Flex>
          </Box>
        ))}
      </Box>
    ),
    [items]
  )

  return (
    <Tooltip content={content} placement="top" portal="documentScrollElement">
      {children}
    </Tooltip>
  )
}
