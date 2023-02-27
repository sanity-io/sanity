import {
  LeaveIcon,
  ChevronDownIcon,
  CogIcon,
  CheckmarkIcon,
  UsersIcon,
  HelpCircleIcon,
  CommentIcon,
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
import {userHasRole} from '../../../../util/userHasRole'
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
  const {colorSchemeOptions} = useColorScheme()
  const {currentUser, projectId, auth} = useWorkspace()
  const {scheme} = useColorScheme()
  const theme = useRootTheme().theme as StudioTheme

  const isAdmin = Boolean(currentUser && userHasRole(currentUser, 'administrator'))
  const providerTitle = getProviderTitle(currentUser?.provider)

  const popoverProps: MenuButtonProps['popover'] = useMemo(
    () => ({
      placement: 'bottom-end',
      portal: true,
      preventOverflow: true,
      scheme: scheme,
      constrainSize: true,
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
          {!theme.__legacy &&
            colorSchemeOptions.map((option) => (
              <MenuItem
                aria-label={`Use ${option} appearance`}
                icon={option.icon}
                iconRight={option.selected && <CheckmarkIcon />}
                key={option.name}
                onClick={() => option.onSelect()}
                pressed={option.selected}
                text={option.title}
              />
            ))}

          <MenuDivider />

          <MenuItem
            as="a"
            aria-label="Manage project"
            href={`https://sanity.io/manage/project/${projectId}`}
            target="_blank"
            text="Manage project"
            icon={CogIcon}
          />
          {isAdmin && (
            <MenuItem
              as="a"
              aria-label="Invite members"
              href={`https://sanity.io/manage/project/${projectId}/members`}
              target="_blank"
              text="Invite members"
              icon={UsersIcon}
            />
          )}
          <MenuItem
            as="a"
            aria-label="Help & support"
            href={`https://www.sanity.io/contact/support`}
            target="_blank"
            text="Help & support"
            icon={HelpCircleIcon}
          />
          {isAdmin && (
            <MenuItem
              as="a"
              aria-label="Contact sales"
              href={`https://www.sanity.io/contact/sales?ref=studio`}
              target="_blank"
              text="Contact sales"
              icon={CommentIcon}
            />
          )}

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
