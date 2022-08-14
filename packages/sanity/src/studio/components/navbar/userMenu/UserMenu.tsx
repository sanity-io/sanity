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
import {getProviderTitle} from '../../../../datastores/authStore/providerTitle'
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

export function UserMenu() {
  const {currentUser, projectId, auth} = useWorkspace()
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
              <Label size={1} muted>
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
                  {currentUser?.name}
                </Text>

                <Text size={1} muted textOverflow="ellipsis">
                  {currentUser?.email}
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

          {auth.logout && (
            <>
              <MenuDivider />
              <MenuItem
                iconRight={LeaveIcon}
                text="Sign out"
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
