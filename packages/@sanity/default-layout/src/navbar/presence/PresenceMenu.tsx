import {UserAvatar} from '@sanity/base/components'
import {useMinimalGlobalPresence} from '@sanity/base/hooks'
import {
  Card,
  AvatarStack,
  MenuButton,
  Menu,
  MenuDivider,
  MenuItem,
  Button,
  Text,
  Box,
  Stack,
  MenuButtonProps,
} from '@sanity/ui'
import {CogIcon, UsersIcon} from '@sanity/icons'
import React, {useMemo} from 'react'
import styled from 'styled-components'
import {StatusButton} from '../components'
import {PresenceMenuItem} from './PresenceMenuItem'

type PresenceMenuProps = {
  collapse?: boolean
  maxAvatars?: number
  projectId: string
  label?: string
}
const AvatarStackCard = styled(Card)`
  background: transparent;
`

const FooterCard = styled(Card)`
  position: sticky;
  bottom: 0;
`

const StyledMenu = styled(Menu)`
  max-width: 350px;
  min-width: 250px;
`

const PRESENCE_MENU_POPOVER_PROPS: MenuButtonProps['popover'] = {
  portal: true,
  constrainSize: true,
  scheme: 'light',
}

export function PresenceMenu(props: PresenceMenuProps) {
  const {collapse, maxAvatars, projectId, label = 'Who is here'} = props
  const presence = useMinimalGlobalPresence()
  const hasPresence = presence.length > 0

  const button = useMemo(
    () =>
      collapse ? (
        <StatusButton
          icon={UsersIcon}
          mode="bleed"
          statusTone={hasPresence ? 'positive' : undefined}
          aria-label={label}
        />
      ) : (
        <Button mode="bleed" padding={1} aria-label={label}>
          <AvatarStackCard>
            <AvatarStack maxLength={maxAvatars}>
              {presence.map((item) => (
                <UserAvatar key={item.user.id} user={item.user} />
              ))}
            </AvatarStack>
          </AvatarStackCard>
        </Button>
      ),
    [collapse, maxAvatars, presence, hasPresence]
  )

  return (
    <MenuButton
      button={button}
      popover={PRESENCE_MENU_POPOVER_PROPS}
      id="presence-menu"
      placement="bottom"
      menu={
        <StyledMenu padding={0}>
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
          {hasPresence && (
            <Box padding={1} paddingBottom={0}>
              {presence.map((item) => (
                <PresenceMenuItem presence={item} key={item.user.id} />
              ))}
            </Box>
          )}
          <FooterCard padding={1} paddingTop={0} radius={3}>
            <Stack space={1}>
              <MenuDivider />
              <MenuItem
                as="a"
                text="Manage members"
                paddingY={4}
                iconRight={CogIcon}
                href={`https://sanity.io/manage/project/${projectId}`}
                target="_blank"
                rel="noopener noreferrer"
              />
            </Stack>
          </FooterCard>
        </StyledMenu>
      }
    />
  )
}
