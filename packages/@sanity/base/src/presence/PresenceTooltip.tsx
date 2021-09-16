import React from 'react'
import {Tooltip, Placement, Box, Card, Flex} from '@sanity/ui'
import {UserAvatar} from '../components/UserAvatar'
import type {FormFieldPresence} from './types'

import {TextWrapper} from './PresenceTooltip.styled'

interface PresenceTooltipProps {
  children?: React.ReactElement
  items: FormFieldPresence[]
  placement?: Placement
}

export function PresenceTooltip(props: PresenceTooltipProps) {
  const {children, items, placement} = props

  const content = (
    <Box padding={1}>
      {items.map((item) => (
        <Card key={item.user.id} padding={1}>
          <Flex align="center">
            <div>
              <UserAvatar user={item.user} status="online" />
            </div>

            <TextWrapper>{item.user.displayName}</TextWrapper>
          </Flex>
        </Card>
      ))}
    </Box>
  )

  return (
    <Tooltip content={content} open placement={placement}>
      {children}
    </Tooltip>
  )
}
