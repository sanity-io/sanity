import React, {forwardRef, useMemo} from 'react'
import {GlobalPresence} from '@sanity/base/presence'
import {orderBy} from 'lodash'
import * as PathUtils from '@sanity/util/paths'
import {Card, MenuItem} from '@sanity/ui'
import {UserAvatar} from '@sanity/base/components'
import {LinkIcon} from '@sanity/icons'
import {IntentLink} from '@sanity/state-router/components'
import styled from 'styled-components'

interface PresenceListRowProps {
  presence: GlobalPresence
}

const AvatarCard = styled(Card)`
  background: transparent;
`

const StyledMenuItem = styled(MenuItem)`
  [data-ui='Flex'] {
    align-items: center;
  }
`
export function PresenceMenuItem({presence}: PresenceListRowProps) {
  const lastActiveLocation = orderBy(presence.locations || [], ['lastActiveAt'], ['desc']).find(
    (location) => location.documentId
  )
  const hasLink = Boolean(lastActiveLocation?.documentId)

  const LinkComponent = useMemo(
    () =>
      // eslint-disable-next-line no-shadow
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
    <StyledMenuItem
      forwardedAs={lastActiveLocation ? LinkComponent : 'div'}
      data-as={lastActiveLocation ? 'a' : 'div'}
      iconRight={hasLink ? LinkIcon : null}
      text={presence.user.displayName}
      icon={
        <AvatarCard scheme="light">
          <UserAvatar size={1} key={presence.user.id} user={presence.user} />
        </AvatarCard>
      }
    />
  )
}
