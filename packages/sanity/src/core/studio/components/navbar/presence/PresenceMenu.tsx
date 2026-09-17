import {AddUserIcon} from '@sanity/icons/AddUser'
import {UsersIcon} from '@sanity/icons/Users'
import {Stack, Text} from '@sanity/ui'
import {Menu, MenuDivider} from '@sanity/ui/menu'
import {useCallback, useMemo, useState} from 'react'
import {Box} from 'ui5'

import {MenuButton, type MenuButtonProps} from '../../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {StatusButton} from '../../../../components/StatusButton'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useGlobalPresence} from '../../../../store/presence/useGlobalPresence'
import {useColorSchemeValue} from '../../../colorScheme'
import {useEnvAwareSanityWebsiteUrl} from '../../../hooks/useEnvAwareSanityWebsiteUrl'
import {useWorkspace} from '../../../workspace'
import {useCanInviteProjectMembers} from '../useCanInviteMembers'
import {footerStack, menu} from './PresenceMenu.css'
import {PresenceMenuItem} from './PresenceMenuItem'

export function PresenceMenu() {
  const presence = useGlobalPresence()
  const {projectId} = useWorkspace()
  const scheme = useColorSchemeValue()
  const {t} = useTranslation()
  const hasPresence = presence.length > 0

  const [open, setOpen] = useState(false)

  const canInviteMembers = useCanInviteProjectMembers({
    // Only enable the permission check when the menu is open
    // to prevent unnecessary requests to the server.
    enabled: open,
  })

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

  const envAwareWebsiteUrl = useEnvAwareSanityWebsiteUrl()
  return (
    <MenuButton
      button={button}
      aria-label={t('presence.aria-label')}
      id="global-presence-menu"
      onOpen={() => setOpen(true)}
      menu={
        <Menu className={menu}>
          {hasPresence &&
            presence.map((item) => (
              <PresenceMenuItem
                key={item.user.id}
                focused={focusedId === item.user.id}
                onFocus={handleItemFocus}
                locations={item.locations}
                user={item.user}
              />
            ))}

          {!hasPresence && (
            <Box padding={3}>
              <Stack gap={3}>
                <Text weight="medium" size={1}>
                  {t('presence.no-one-else-title')}
                </Text>

                <Text size={1} muted>
                  {t('presence.no-one-else-description')}
                </Text>
              </Stack>
            </Box>
          )}

          {canInviteMembers && (
            <Stack className={footerStack} gap={1}>
              <MenuDivider />

              <MenuItem
                as="a"
                href={`${envAwareWebsiteUrl}/manage/project/${projectId}/members?invite=true`}
                icon={AddUserIcon}
                onFocus={handleClearFocusedItem}
                rel="noopener noreferrer"
                target="_blank"
                text={t('presence.action.manage-members')}
              />
            </Stack>
          )}
        </Menu>
      }
      onClose={handleClose}
      popover={popoverProps}
    />
  )
}
