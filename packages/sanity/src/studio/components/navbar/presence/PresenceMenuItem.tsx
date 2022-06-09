import React, {forwardRef, memo, useMemo} from 'react'
import {orderBy} from 'lodash'
import * as PathUtils from '@sanity/util/paths'
import {Box, Card, Flex, MenuItem, Text} from '@sanity/ui'
import {LinkIcon} from '@sanity/icons'
import styled from 'styled-components'
import {UserAvatar} from '../../../../components/UserAvatar'
import {GlobalPresence} from '../../../../datastores'
import {IntentLink} from '../../../../router'

const AvatarCard = styled(Card)`
  background: transparent;
  margin: calc((-35px + 11px) / 2);
`

interface PresenceListRowProps {
  presence: GlobalPresence
}

export const PresenceMenuItem = memo(function PresenceMenuItem({presence}: PresenceListRowProps) {
  const lastActiveLocation = orderBy(presence.locations || [], ['lastActiveAt'], ['desc']).find(
    (location) => location.documentId
  )
  const hasLink = Boolean(lastActiveLocation?.documentId)

  const LinkComponent = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      forwardRef(function LinkComponent(linkProps, ref: React.ForwardedRef<HTMLAnchorElement>) {
        if (!lastActiveLocation?.path) return null

        return (
          <IntentLink
            {...linkProps}
            intent="edit"
            params={{
              id: lastActiveLocation?.documentId,
              path: PathUtils.toString(lastActiveLocation?.path),
            }}
            ref={ref}
          />
        )
      }),
    [lastActiveLocation]
  )

  return (
    <MenuItem
      as={lastActiveLocation ? LinkComponent : 'div'}
      data-as={lastActiveLocation ? 'a' : 'div'}
      padding={4}
      paddingRight={3}
    >
      <Flex align="center">
        <AvatarCard>
          <UserAvatar size={1} key={presence.user.id} user={presence.user} />
        </AvatarCard>

        <Box flex={1} marginLeft={4}>
          <Text textOverflow="ellipsis">{presence.user.displayName}</Text>
        </Box>

        {hasLink && (
          <Box marginLeft={3}>
            <Text>
              <LinkIcon />
            </Text>
          </Box>
        )}
      </Flex>
    </MenuItem>
  )
})
