import React, {forwardRef, memo, useCallback, useEffect, useMemo, useState} from 'react'
import {orderBy} from 'lodash'
import * as PathUtils from '@sanity/util/paths'
import {Card, Flex, MenuItem, Stack, Text} from '@sanity/ui'
import styled from 'styled-components'
import {GlobalPresence} from '../../../../store'
import {UserAvatar} from '../../../../components'
import {IntentLink} from 'sanity/router'
import {useTranslation} from '../../../../i18n'

const AvatarCard = styled(Card)`
  background: transparent;
  margin: calc((-35px + 11px) / 2);
`

interface PresenceListRowProps {
  focused: boolean
  onFocus: (id: string) => void
  presence: GlobalPresence
}

export const PresenceMenuItem = memo(function PresenceMenuItem(props: PresenceListRowProps) {
  const {presence, focused, onFocus} = props
  const [menuItemElement, setMenuItemElement] = useState<HTMLElement | null>(null)
  const {t} = useTranslation()

  const lastActiveLocation = orderBy(presence.locations || [], ['lastActiveAt'], ['desc']).find(
    (location) => location.documentId,
  )
  const hasLink = Boolean(lastActiveLocation?.documentId)

  /**
   * This is a workaround to keep focus on the selected menu item
   * when the list of users in the menu is updated
   */
  useEffect(() => {
    if (focused && menuItemElement) {
      menuItemElement.focus()
      menuItemElement.setAttribute('data-selected', '')
    }

    if (!focused) {
      menuItemElement?.removeAttribute('data-selected')
    }
  }, [menuItemElement, focused])

  const handleFocus = useCallback(() => {
    onFocus(presence.user.id)
  }, [onFocus, presence.user.id])

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
    [lastActiveLocation],
  )

  return (
    <MenuItem
      as={lastActiveLocation ? LinkComponent : 'div'}
      data-as={lastActiveLocation ? 'a' : 'div'}
      onFocus={handleFocus}
      paddingY={hasLink ? 4 : 3}
      paddingLeft={4}
      paddingRight={3}
      ref={setMenuItemElement}
    >
      <Flex align="center">
        <AvatarCard>
          <UserAvatar
            size={1}
            key={presence.user.id}
            user={presence.user}
            status={hasLink ? 'editing' : 'inactive'}
          />
        </AvatarCard>

        <Stack space={2} marginLeft={4}>
          <Text textOverflow="ellipsis">{presence.user.displayName}</Text>
          {!hasLink && (
            <Text size={0} muted textOverflow="ellipsis">
              {t('navbar.presence-menu.not-in-a-document')}
            </Text>
          )}
        </Stack>
      </Flex>
    </MenuItem>
  )
})
