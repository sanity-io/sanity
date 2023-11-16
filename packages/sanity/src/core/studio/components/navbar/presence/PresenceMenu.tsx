import {CogIcon, UsersIcon} from '@sanity/icons'
import {Box, Menu, MenuButton, MenuDivider, Stack, Text} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'
import styled from 'styled-components'
import {StatusButton} from '../../../../components'
import {useGlobalPresence} from '../../../../store'
import {useColorScheme} from '../../../colorScheme'
import {MenuItem} from '../../../../../ui'
import {useWorkspace} from '../../../workspace'
import {PresenceMenuItem} from './PresenceMenuItem'

const StyledMenu = styled(Menu)`
  max-width: 350px;
  min-width: 250px;
`

const FooterStack = styled(Stack)`
  position: sticky;
  bottom: 0;
`

export function PresenceMenu() {
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

  const handleClose = useCallback(() => {
    setFocusedId('')
  }, [])

  const button = useMemo(() => {
    return (
      <StatusButton
        icon={UsersIcon}
        mode="bleed"
        tone={hasPresence ? 'positive' : undefined}
        tooltipProps={{
          content: 'Active users',
          placement: 'bottom',
          portal: true,
        }}
      />
    )
  }, [hasPresence])

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
            <Box padding={3}>
              <Stack space={3}>
                <Text weight="medium" size={1}>
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
              rel="noopener noreferrer"
              target="_blank"
              text="Manage members"
            />
          </FooterStack>
        </StyledMenu>
      }
      onClose={handleClose}
      popover={popoverProps}
    />
  )
}
