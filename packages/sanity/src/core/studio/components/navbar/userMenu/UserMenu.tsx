import {
  SunIcon,
  MoonIcon,
  LeaveIcon,
  ChevronDownIcon,
  CogIcon,
  DesktopIcon,
  CheckmarkIcon,
} from '@sanity/icons'
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
  useRootTheme,
} from '@sanity/ui'
import React, {useMemo} from 'react'
import styled from 'styled-components'
import {UserAvatar} from '../../../../components'
import {getProviderTitle} from '../../../../store'
import {StudioTheme} from '../../../../theme'
import {useColorScheme} from '../../../colorScheme'
import {useWorkspace} from '../../../workspace'
import {LoginProviderLogo} from './LoginProviderLogo'

const AVATAR_SIZE = 1

const StyledMenu = styled(Menu)`
  min-width: 125px;
  max-width: 350px;
`

const AvatarBox = styled(Box)`
  position: relative;
  min-width: ${({theme}) => theme.sanity.avatar.sizes[AVATAR_SIZE].size}px;
  min-height: ${({theme}) => theme.sanity.avatar.sizes[AVATAR_SIZE].size}px;
`

export function UserMenu() {
  const {currentUser, projectId, auth} = useWorkspace()
  const theme = useRootTheme().theme as StudioTheme
  const {scheme, setScheme, clearStoredScheme, usingSystemScheme} = useColorScheme()

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

  return (
    <MenuButton
      button={
        <Button mode="bleed" padding={0} paddingX={1}>
          <Flex align="center" gap={1}>
            <UserAvatar user="me" size={1} />
            <Text size={AVATAR_SIZE} muted>
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
                  <UserAvatar size={AVATAR_SIZE} user="me" />
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

          {!theme?.__legacy && (
            <>
              <MenuDivider />

              <Box padding={2}>
                <Label size={1} muted>
                  Appearance
                </Label>
              </Box>

              <MenuItem
                aria-label="Use system appearance"
                icon={DesktopIcon}
                onClick={clearStoredScheme}
                pressed={usingSystemScheme}
                text="System"
                iconRight={usingSystemScheme && <CheckmarkIcon />}
              />

              <MenuItem
                aria-label="Use dark appearance"
                icon={MoonIcon}
                onClick={() => setScheme('dark')}
                pressed={scheme === 'dark' && !usingSystemScheme}
                iconRight={scheme === 'dark' && !usingSystemScheme && <CheckmarkIcon />}
                text="Dark"
              />

              <MenuItem
                aria-label="Use light appearance"
                icon={SunIcon}
                onClick={() => setScheme('light')}
                pressed={scheme === 'light' && !usingSystemScheme}
                iconRight={scheme === 'light' && !usingSystemScheme && <CheckmarkIcon />}
                text="Light"
              />
            </>
          )}

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
