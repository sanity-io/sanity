import {SunIcon, MoonIcon, LeaveIcon, ChevronDownIcon, CogIcon} from '@sanity/icons'
import {
  Box,
  Button,
  Card,
  Flex,
  Label,
  Menu,
  MenuButton,
  MenuButtonProps,
  MenuDivider,
  MenuItem,
  Stack,
  Text,
  Tooltip,
} from '@sanity/ui'
import React, {useCallback, useMemo} from 'react'
import styled from 'styled-components'
import {UserAvatar} from '../../../../components/UserAvatar'
import {useColorScheme} from '../../../colorScheme'
import {useWorkspace} from '../../../workspace'
import {LoginProviderLogo} from './LoginProviderLogo'

const StyledMenu = styled(Menu)`
  min-width: 125px;
  max-width: 350px;
`

const AvatarBox = styled(Box)`
  position: relative;
`

const getProviderTitle = (provider?: string) => {
  if (provider === 'google') {
    return 'Google'
  }

  if (provider === 'github') {
    return 'GitHub'
  }

  if (provider === 'sanity') {
    return 'Sanity'
  }

  if (provider?.startsWith('saml-')) {
    return 'SAML/SSO'
  }

  return undefined
}

export function UserMenu() {
  const {
    __internal: {auth},
    currentUser,
    projectId,
  } = useWorkspace()
  const {scheme, setScheme} = useColorScheme()

  const providerTitle = getProviderTitle(currentUser?.provider)

  const popoverProps: MenuButtonProps['popover'] = useMemo(
    () => ({
      placement: 'bottom-end',
      portal: true,
      preventOverflow: true,
      scheme: scheme,
    }),
    [scheme]
  )

  const handleToggleScheme = useCallback(() => {
    setScheme(scheme === 'dark' ? 'light' : 'dark')
  }, [scheme, setScheme])

  const handleLogout = useCallback(() => {
    auth.controller.logout()
  }, [auth.controller])

  return (
    <MenuButton
      button={
        <Button mode="bleed" padding={0} paddingX={1}>
          <Flex align="center" gap={1}>
            <UserAvatar user="me" size={1} />
            <Text size={1} muted>
              <ChevronDownIcon />
            </Text>
          </Flex>
        </Button>
      }
      id="user-menu"
      menu={
        <StyledMenu>
          <Card padding={2}>
            <Box marginBottom={3}>
              <Label size={0} muted>
                Signed in as
              </Label>
            </Box>

            <Flex align="center">
              <Tooltip
                disabled={!providerTitle}
                portal
                content={
                  providerTitle && (
                    <Box padding={2}>
                      <Text size={1}>Signed in with {providerTitle}</Text>
                    </Box>
                  )
                }
              >
                <AvatarBox marginRight={3}>
                  <UserAvatar size={1} user="me" />
                  {currentUser?.provider && <LoginProviderLogo provider={currentUser.provider} />}
                </AvatarBox>
              </Tooltip>

              <Stack space={2} flex={1}>
                <Text size={1} weight="semibold" textOverflow="ellipsis">
                  {currentUser.name}
                </Text>

                <Text size={1} muted textOverflow="ellipsis">
                  {currentUser.email}
                </Text>
              </Stack>
            </Flex>
          </Card>

          <MenuDivider />

          <MenuItem
            icon={scheme === 'dark' ? SunIcon : MoonIcon}
            onClick={handleToggleScheme}
            text={scheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          />

          <MenuDivider />

          <MenuItem
            as="a"
            href={`https://sanity.io/manage/project/${projectId}`}
            target="_blank"
            text="Manage project"
            icon={CogIcon}
          />

          <MenuDivider />

          <MenuItem iconRight={LeaveIcon} onClick={handleLogout} text="Sign out" />
        </StyledMenu>
      }
      popover={popoverProps}
    />
  )
}
