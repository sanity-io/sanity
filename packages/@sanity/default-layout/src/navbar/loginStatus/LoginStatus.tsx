import React from 'react'
import {UserAvatar} from '@sanity/base/components'
import {
  Button,
  MenuItem,
  Menu,
  MenuButton,
  Flex,
  Box,
  Text,
  MenuButtonProps,
  MenuDivider,
  Card,
  Stack,
  Label,
  Tooltip,
} from '@sanity/ui'
import {ChevronDownIcon, CogIcon, LeaveIcon} from '@sanity/icons'
import styled from 'styled-components'
import {CurrentUser} from '@sanity/types/src'
import {LoginProviderLogo} from './LoginProviderLogo'

interface LoginStatusProps {
  onLogout: () => void
  currentUser: CurrentUser
  projectId: string
}

const StyledMenu = styled(Menu)`
  min-width: 125px;
  max-width: 350px;
`

const AvatarBox = styled(Box)`
  position: relative;
`

const MENU_BUTTON_POPOVER_PROPS: MenuButtonProps['popover'] = {
  portal: true,
  scheme: 'light',
  placement: 'bottom-end',
}

const getProviderTitle = (provider: string) => {
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

export function LoginStatus(props: LoginStatusProps) {
  const {currentUser, onLogout, projectId} = props

  const providerTitle = getProviderTitle(currentUser.provider)

  return (
    <MenuButton
      button={
        <Button mode="bleed" paddingX={1} paddingY={0} title="Toggle user menu">
          <Flex align="center">
            <UserAvatar size="medium" tone="navbar" userId="me" />
            <Box marginLeft={1}>
              <Text size={1}>
                <ChevronDownIcon />
              </Text>
            </Box>
          </Flex>
        </Button>
      }
      id="login-status-menu"
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
                  <UserAvatar size="medium" userId="me" />
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
            as="a"
            href={`https://sanity.io/manage/project/${projectId}`}
            target="_blank"
            text="Manage project"
            icon={CogIcon}
          />
          <MenuDivider />
          <MenuItem text="Sign out" icon={LeaveIcon} onClick={onLogout} />
        </StyledMenu>
      }
      popover={MENU_BUTTON_POPOVER_PROPS}
    />
  )
}
