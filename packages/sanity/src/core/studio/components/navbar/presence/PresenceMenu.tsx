import {CogIcon, UsersIcon} from '@sanity/icons'
import {
  AvatarStack,
  Box,
  Button,
  Card,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  Stack,
  Text,
} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'
import styled from 'styled-components'
import {StatusButton, UserAvatar} from '../../../../components'
import {useGlobalPresence} from '../../../../store'
import {useColorScheme} from '../../../colorScheme'
import {useWorkspace} from '../../../workspace'
import {PresenceMenuItem} from './PresenceMenuItem'

const MAX_AVATARS = 4

const AvatarStackCard = styled(Card)`
  background: transparent;
`

const StyledMenu = styled(Menu)`
  max-width: 350px;
  min-width: 250px;
`

const FooterStack = styled(Stack)`
  position: sticky;
  bottom: 0;
`

interface PresenceMenuProps {
  collapse?: boolean
}

export function PresenceMenu(props: PresenceMenuProps) {
  const {collapse} = props
  const presence = useGlobalPresence()
  const {projectId} = useWorkspace()
  const {scheme} = useColorScheme()
  const hasPresence = presence.length > 0

  /**
   * This id is used as a workaround to keep focus on the selected menu item
   * when the list of users in the menu is updated
   */
  const [focusedId, setFocusedId] = useState<string>()

  const handleItemFocus = useCallback((id: string) => {
    setFocusedId(id)
  }, [])

  const handleClearFocusedItem = useCallback(() => {
    setFocusedId('')
  }, [])

  const button = useMemo(() => {
    if (collapse) {
      return (
        <StatusButton icon={UsersIcon} mode="bleed" tone={hasPresence ? 'positive' : undefined} />
      )
    }

    return (
      <Button mode="bleed" padding={1}>
        <AvatarStackCard>
          <AvatarStack maxLength={MAX_AVATARS} aria-label="Who is here">
            {presence.map((item) => (
              <UserAvatar key={item.user.id} user={item.user} />
            ))}
          </AvatarStack>
        </AvatarStackCard>
      </Button>
    )
  }, [collapse, hasPresence, presence])

  const popoverProps = useMemo(
    () => ({
      constrainSize: true,
      portal: true,
      scheme: scheme,
    }),
    [scheme],
  )

  return (
    <MenuButton
      button={button}
      id="global-presence-menu"
      onClose={handleClearFocusedItem}
      menu={
        <StyledMenu padding={1}>
          {hasPresence && (
            <Stack>
              {presence.map((item) => (
                <PresenceMenuItem
                  focused={focusedId === item.user.id}
                  key={item.user.id}
                  onFocus={handleItemFocus}
                  presence={item}
                />
              ))}
            </Stack>
          )}

          {!hasPresence && (
            <Box paddingX={3} paddingY={4}>
              <Stack space={3}>
                <Text weight="semibold" size={2}>
                  No one else is here
                </Text>

                <Text size={1} muted>
                  Invite people to the project to see their online status.
                </Text>
              </Stack>
            </Box>
          )}

          <FooterStack space={1}>
            <MenuDivider />

            <MenuItem
              as="a"
              href={`https://sanity.io/manage/project/${projectId}`}
              iconRight={CogIcon}
              onFocus={handleClearFocusedItem}
              paddingY={4}
              rel="noopener noreferrer"
              target="_blank"
              text="Manage members"
            />
          </FooterStack>
        </StyledMenu>
      }
      popover={popoverProps}
    />
  )
}
