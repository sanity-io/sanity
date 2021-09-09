// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {UserAvatar} from '@sanity/base/components'
import {useGlobalPresence} from '@sanity/base/hooks'
import {
  Card,
  AvatarStack,
  MenuButton,
  Menu,
  MenuDivider,
  MenuItem as UIMenuItem,
  Button,
  Text,
  Box,
  Stack,
} from '@sanity/ui'
import {CogIcon, UsersIcon} from '@sanity/icons'
import React, {useMemo} from 'react'
import styled from 'styled-components'
import {versionedClient} from '../../versionedClient'
import {StatusButton} from '../components'
import {PresenceMenuItem} from '.'

type PresenceMenuProps = {
  collapse?: boolean
  maxAvatars?: number
}
const AvatarStackCard = styled(Card)`
  background: transparent;
`

const FooterCard = styled(Card)`
  position: sticky;
  bottom: 0;
`

const MenuItem = styled(UIMenuItem)`
  [data-ui='Flex'] {
    align-items: center;
  }
`

export function PresenceMenu({collapse, maxAvatars}: PresenceMenuProps) {
  const {projectId} = versionedClient.config()
  const presence = useGlobalPresence()
  const hasPresence = presence.length > 0

  const PresenceButton = useMemo(
    () =>
      collapse ? (
        <StatusButton
          icon={UsersIcon}
          mode="bleed"
          statusTone={hasPresence ? 'positive' : undefined}
        />
      ) : (
        <Button mode="bleed" tone="primary" padding={1}>
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
      button={PresenceButton}
      popover={{portal: true, constrainSize: true, scheme: 'light'}}
      id="presence-menu"
      placement="bottom-end"
      menu={
        <Menu padding={0}>
          <>
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
                  forwardedAs="a"
                  text="Manage members"
                  paddingY={4}
                  iconRight={CogIcon}
                  href={`https://sanity.io/manage/project/${projectId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              </Stack>
            </FooterCard>
          </>
        </Menu>
      }
    />
  )
}
