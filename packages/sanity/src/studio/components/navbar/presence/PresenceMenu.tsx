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
import React, {useMemo} from 'react'
import styled from 'styled-components'
import {UserAvatar} from '../../../../components/UserAvatar'
import {useGlobalPresence} from '../../../../datastores'
import {useColorScheme} from '../../../colorScheme'
import {useWorkspace} from '../../../workspace'
import {StatusButton} from '../../StatusButton'
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
  const hasPresence = presence.length > 0
  const {scheme} = useColorScheme()

  const button = useMemo(() => {
    if (collapse) {
      return (
        <StatusButton icon={UsersIcon} mode="bleed" active={hasPresence} statusTone="positive" />
      )
    }

    return (
      <Button mode="bleed" padding={1}>
        <AvatarStackCard>
          <AvatarStack maxLength={MAX_AVATARS}>
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
    [scheme]
  )

  return (
    <MenuButton
      id="global-presence-menu"
      button={button}
      menu={
        <StyledMenu padding={1}>
          {hasPresence && (
            <Stack space={2}>
              {presence.map((item) => (
                <PresenceMenuItem key={item.user.id} presence={item} />
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
