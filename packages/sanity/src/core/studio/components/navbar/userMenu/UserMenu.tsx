import {getProviderTitle} from '@sanity/access-ui'
import {
  // oxlint-disable-next-line no-restricted-imports
  Button,
  // Button with specific styling, user avatar.
  Card,
  Stack,
  Text,
  useTheme_v2 as useThemeV2,
} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {useMemo} from 'react'
import {Box, Flex} from 'ui5'

import {MenuButton, type MenuButtonProps} from '../../../../../ui-components/menuButton/MenuButton'
import {Tooltip} from '../../../../../ui-components/tooltip/Tooltip'
import {UserAvatar} from '../../../../components/userAvatar/UserAvatar'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useColorSchemeSetValue, useColorSchemeValue} from '../../../colorScheme'
import {useWorkspace} from '../../../workspace'
import {AppearanceMenu} from './ApperanceMenu'
import {LocaleMenu} from './LocaleMenu'
import {LoginProviderLogo} from './LoginProviderLogo'
import {avatarBox, avatarSize2Var, menu} from './UserMenu.css'
import {UserMenuAuthAction} from './UserMenuAuthAction'

export function UserMenu() {
  const {currentUser} = useWorkspace()
  const scheme = useColorSchemeValue()
  const setScheme = useColorSchemeSetValue()
  const {avatar} = useThemeV2()

  const providerTitle = getProviderTitle(currentUser?.provider)

  const {t} = useTranslation()

  const popoverProps: MenuButtonProps['popover'] = useMemo(
    () => ({
      placement: 'bottom',
      portal: true,
      preventOverflow: true,
      scheme: scheme,
      constrainSize: true,
      tone: 'default',
    }),
    [scheme],
  )

  return (
    <MenuButton
      button={
        <Button mode="bleed" padding={0} radius="full">
          <UserAvatar size={1} user="me" />
        </Button>
      }
      id="user-menu"
      menu={
        <Menu className={menu} data-testid="user-menu">
          <Card padding={2}>
            <Flex alignItems="center">
              <Tooltip
                disabled={!providerTitle}
                portal
                content={t('user-menu.login-provider', {providerTitle})}
              >
                <Box
                  className={avatarBox}
                  marginRight={3}
                  style={assignInlineVars({[avatarSize2Var]: `${avatar.sizes[2].size}px`})}
                >
                  <UserAvatar size={2} user="me" />
                  {currentUser?.provider && <LoginProviderLogo provider={currentUser.provider} />}
                </Box>
              </Tooltip>

              <Stack gap={2} flex={1}>
                <Text size={1} weight="medium" textOverflow="ellipsis">
                  {currentUser?.name}
                </Text>

                <Text size={1} muted textOverflow="ellipsis">
                  {currentUser?.email}
                </Text>
              </Stack>
            </Flex>
          </Card>

          {setScheme && <AppearanceMenu setScheme={setScheme} />}
          <LocaleMenu />

          <UserMenuAuthAction layout="menu" />
        </Menu>
      }
      popover={popoverProps}
    />
  )
}
