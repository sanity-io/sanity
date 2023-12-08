import {CheckmarkIcon, CogIcon, LeaveIcon, UsersIcon} from '@sanity/icons'
import {
  Box,
  Card,
  Flex,
  Menu,
  MenuButton,
  MenuButtonProps,
  MenuDivider,
  Stack,
  Text,
  // eslint-disable-next-line no-restricted-imports
  Button, // Button with specific styling, user avatar .
} from '@sanity/ui'
import React, {useMemo} from 'react'
import styled from 'styled-components'
import {UserAvatar} from '../../../../components'
import {getProviderTitle} from '../../../../store'
import {type StudioThemeColorSchemeKey} from '../../../../theme'
import {
  useColorSchemeOptions,
  useColorSchemeSetValue,
  useColorSchemeValue,
} from '../../../colorScheme'
import {useWorkspace} from '../../../workspace'
import {userHasRole} from '../../../../util/userHasRole'
import {MenuItem, Tooltip} from '../../../../../ui'
import {useTranslation} from '../../../../i18n'
import {LoginProviderLogo} from './LoginProviderLogo'
import {LocaleMenu} from './LocaleMenu'

const StyledMenu = styled(Menu)`
  min-width: 200px;
  max-width: 300px;
`

const AvatarBox = styled(Box)`
  position: relative;
  min-width: ${({theme}) => theme.sanity.avatar.sizes[2].size}px;
  min-height: ${({theme}) => theme.sanity.avatar.sizes[2].size}px;
`

function AppearanceMenu({setScheme}: {setScheme: (nextScheme: StudioThemeColorSchemeKey) => void}) {
  const {t} = useTranslation()
  // Subscribe to just what we need, if the menu isn't shown then we're not subscribed to these contexts
  const options = useColorSchemeOptions(setScheme, t)

  return (
    <>
      <MenuDivider />

      {options.map(({icon, label, name, onSelect, selected, title}) => (
        <MenuItem
          key={name}
          aria-label={label}
          icon={icon}
          onClick={onSelect}
          pressed={selected}
          text={title}
          iconRight={selected && <CheckmarkIcon />}
        />
      ))}
    </>
  )
}

export function UserMenu() {
  const {currentUser, projectId, auth} = useWorkspace()
  const scheme = useColorSchemeValue()
  const setScheme = useColorSchemeSetValue()

  const isAdmin = Boolean(currentUser && userHasRole(currentUser, 'administrator'))
  const providerTitle = getProviderTitle(currentUser?.provider)

  const {t} = useTranslation()

  const popoverProps: MenuButtonProps['popover'] = useMemo(
    () => ({
      placement: 'bottom-end',
      portal: true,
      preventOverflow: true,
      scheme: scheme,
      constrainSize: true,
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
        <StyledMenu>
          <Card padding={2}>
            <Flex align="center">
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

              <Stack space={2} flex={1}>
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
          <MenuDivider />

          <MenuItem
            as="a"
            aria-label={t('user-menu.action.manage-project-aria-label')}
            href={`https://sanity.io/manage/project/${projectId}`}
            target="_blank"
            text={t('user-menu.action.manage-project')}
            icon={CogIcon}
          />
          {isAdmin && (
            <MenuItem
              as="a"
              aria-label={t('user-menu.action.invite-members-aria-label')}
              href={`https://sanity.io/manage/project/${projectId}/members`}
              target="_blank"
              text={t('user-menu.action.invite-members')}
              icon={UsersIcon}
            />
          )}

          {auth.logout && (
            <>
              <MenuDivider />
              <MenuItem
                iconRight={LeaveIcon}
                text={t('user-menu.action.sign-out')}
                disabled={!auth.logout}
                {...(auth.logout && {onClick: auth.logout})}
              />
            </>
          )}
        </StyledMenu>
      }
      popover={popoverProps}
    />
  )
}
