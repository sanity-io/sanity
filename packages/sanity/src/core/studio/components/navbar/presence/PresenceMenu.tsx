import {CogIcon, UsersIcon} from '@sanity/icons'
import {
  AvatarStack,
  Box,
  Button,
  Card,
  Menu,
  MenuButton,
  MenuButtonProps,
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
import {useTranslation} from '../../../../i18n'

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
  background-color: var(--card-bg-color);
`

interface PresenceMenuProps {
  collapse?: boolean
}

export function PresenceMenu(props: PresenceMenuProps) {
  const {collapse} = props
  const presence = useGlobalPresence()
  const {projectId} = useWorkspace()
  const {scheme} = useColorScheme()
  const {t} = useTranslation()
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
          <AvatarStack maxLength={MAX_AVATARS} aria-label={t('presence.aria-label')}>
            {presence.map((item) => (
              <UserAvatar key={item.user.id} user={item.user} />
            ))}
          </AvatarStack>
        </AvatarStackCard>
      </Button>
    )
  }, [collapse, hasPresence, presence, t])

  const popoverProps = useMemo(
    (): MenuButtonProps['popover'] => ({
      constrainSize: true,
      fallbackPlacements: ['bottom'],
      placement: 'bottom',
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
        <StyledMenu padding={1} paddingBottom={0}>
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
                  {t('presence.no-one-else-title')}
                </Text>

                <Text size={1} muted>
                  {t('presence.no-one-else-description')}
                </Text>
              </Stack>
            </Box>
          )}

          <FooterStack space={1} paddingBottom={1}>
            <MenuDivider />

            <MenuItem
              as="a"
              href={`https://sanity.io/manage/project/${projectId}`}
              iconRight={CogIcon}
              onFocus={handleClearFocusedItem}
              paddingY={4}
              rel="noopener noreferrer"
              target="_blank"
              text={t('presence.action.manage-members')}
            />
          </FooterStack>
        </StyledMenu>
      }
      popover={popoverProps}
    />
  )
}
