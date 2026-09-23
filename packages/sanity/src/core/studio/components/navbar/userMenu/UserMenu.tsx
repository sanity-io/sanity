import {getProviderTitle} from '@sanity/access-ui'
// oxlint-disable-next-line no-restricted-imports -- Button with specific styling, user avatar.
import {Button, Card, Text} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {useMemo} from 'react'
import {styled} from 'styled-components'
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
import {UserMenuAuthAction} from './UserMenuAuthAction'

const StyledMenu = styled(Menu)`
  min-width: 200px;
  max-width: 300px;
`

const AvatarBox = styled(Box)`
  position: relative;
  min-width: ${({theme}) => theme.sanity.avatar.sizes[2].size /* oxlint-disable-line no-deprecated -- will fix in follow up PR */}px;
  min-height: ${({theme}) => theme.sanity.avatar.sizes[2].size /* oxlint-disable-line no-deprecated -- will fix in follow up PR */}px;
`

export function UserMenu() {
  const {currentUser} = useWorkspace()
  const scheme = useColorSchemeValue()
  const setScheme = useColorSchemeSetValue()

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
        <StyledMenu data-testid="user-menu">
          <Card padding={2}>
            <Flex alignItems="center">
              <Tooltip
                disabled={!providerTitle}
                portal
                content={t('user-menu.login-provider', {providerTitle})}
              >
                <AvatarBox marginRight={3}>
                  <UserAvatar size={2} user="me" />
                  {currentUser?.provider && <LoginProviderLogo provider={currentUser.provider} />}
                </AvatarBox>
              </Tooltip>

              <Flex gap={2} flexBasis="0%" flexGrow={1} flexDirection="column">
                <Text size={1} weight="medium" textOverflow="ellipsis">
                  {currentUser?.name}
                </Text>

                <Text size={1} muted textOverflow="ellipsis">
                  {currentUser?.email}
                </Text>
              </Flex>
            </Flex>
          </Card>

          {setScheme && <AppearanceMenu setScheme={setScheme} />}
          <LocaleMenu />

          <UserMenuAuthAction layout="menu" />
        </StyledMenu>
      }
      popover={popoverProps}
    />
  )
}
