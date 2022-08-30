import React, {forwardRef, useMemo} from 'react'
import {MinimalGlobalPresence} from '@sanity/base/presence'
import {orderBy} from 'lodash'
import * as PathUtils from '@sanity/util/paths'
import {Box, Card, Flex, MenuItem, Text} from '@sanity/ui'
import {UserAvatar} from '@sanity/base/components'
import {LinkIcon} from '@sanity/icons'
import {IntentLink} from '@sanity/base/router'
import styled from 'styled-components'

interface PresenceListRowProps {
  presence: MinimalGlobalPresence
}

const AvatarCard = styled(Card)`
  background: transparent;
  margin: calc((-35px + 11px) / 2);
`

export function PresenceMenuItem({presence}: PresenceListRowProps) {
  const lastActiveLocation = orderBy(presence.locations || [], ['lastActiveAt'], ['desc']).find(
    (location) => location.documentId
  )
  const hasLink = Boolean(lastActiveLocation?.documentId)

  const LinkComponent = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      forwardRef(function LinkComponent(linkProps, ref: React.ForwardedRef<HTMLAnchorElement>) {
        return (
          <IntentLink
            {...linkProps}
            intent="edit"
            params={{
              id: lastActiveLocation?.documentId,
              path: encodeURIComponent(PathUtils.toString(lastActiveLocation?.path)),
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
        <AvatarCard scheme="light">
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
}
