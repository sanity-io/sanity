import {CogIcon, UsersIcon} from '@sanity/icons'
import {Box, Menu, MenuDivider, Stack, Text} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'
import styled from 'styled-components'
import {StatusButton} from '../../../../components'
import {useGlobalPresence} from '../../../../store'
import {useColorScheme} from '../../../colorScheme'
import {MenuButton, MenuButtonProps, MenuItem} from '../../../../../ui'
import {useTranslation} from '../../../../i18n'
import {useWorkspace} from '../../../workspace'
import {PresenceMenuItem} from './PresenceMenuItem'

const StyledMenu = styled(Menu)`
  max-width: 260px;
`

const FooterStack = styled(Stack)`
  position: sticky;
  bottom: 0;
  background-color: var(--card-bg-color);
`

export function PresenceMenu() {
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
          // @todo: rename, as its no longer an aria-label
          content: t('presence.aria-label'),
        }}
      />
    )
  }, [hasPresence, t])

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
      menu={
        <StyledMenu>
          {hasPresence &&
            presence.map((item) => (
              <PresenceMenuItem
                focused={focusedId === item.user.id}
                key={item.user.id}
                onFocus={handleItemFocus}
                presence={item}
              />
            ))}

          {!hasPresence && (
            <Box padding={3}>
              <Stack space={3}>
                <Text weight="medium" size={1}>
                  {t('presence.no-one-else-title')}
                </Text>

                <Text size={1} muted>
                  {t('presence.no-one-else-description')}
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
              text={t('presence.action.manage-members')}
            />
          </FooterStack>
        </StyledMenu>
      }
      onClose={handleClose}
      popover={popoverProps}
    />
  )
}
