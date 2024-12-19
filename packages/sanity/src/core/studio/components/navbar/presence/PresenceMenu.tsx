import {AddUserIcon, UsersIcon} from '@sanity/icons'
import {Box, Menu, MenuDivider, Stack, Text} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {styled} from 'styled-components'

import {MenuButton, type MenuButtonProps, MenuItem} from '../../../../../ui-components'
import {StatusButton} from '../../../../components'
import {useTranslation} from '../../../../i18n'
import {useGlobalPresence} from '../../../../store'
import {useColorSchemeValue} from '../../../colorScheme'
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
  const scheme = useColorSchemeValue()
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
        aria-label={t('presence.aria-label')}
        mode="bleed"
        tone={hasPresence ? 'positive' : undefined}
        tooltipProps={{
          content: t('presence.tooltip-content'),
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
      tone: 'default',
    }),
    [scheme],
  )

  return (
    <MenuButton
      button={button}
      aria-label={t('presence.aria-label')}
      id="global-presence-menu"
      menu={
        <StyledMenu>
          {hasPresence &&
            presence.map((item) => (
              <PresenceMenuItem
                focused={focusedId === item.user.id}
                key={item.user.id}
                onFocus={handleItemFocus}
                locations={item.locations}
                user={item.user}
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
              href={`https://www.sanity.io/manage/project/${projectId}/members?invite=true`}
              icon={AddUserIcon}
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
