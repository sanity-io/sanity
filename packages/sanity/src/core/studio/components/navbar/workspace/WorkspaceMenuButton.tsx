import {SelectIcon} from '@sanity/icons'
import {
  Button,
  MenuButton,
  MenuItem,
  Menu,
  MenuButtonProps,
  Box,
  Label,
  Tooltip,
  Text,
  Stack,
} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'
import styled from 'styled-components'
import {useActiveWorkspace} from '../../../activeWorkspaceMatcher'
import {useColorScheme} from '../../../colorScheme'
import {useWorkspaces} from '../../../workspaces'
import {useWorkspaceAuthStates} from './hooks'
import {WorkspacePreview} from './WorkspacePreview'
import {useRouter} from 'sanity/router'

const StyledMenu = styled(Menu)`
  max-width: 350px;
  min-width: 250px;
`

const TITLE = 'Select workspace'

interface WorkspaceMenuButtonProps {
  collapsed?: boolean
}

export function WorkspaceMenuButton(props: WorkspaceMenuButtonProps) {
  const {collapsed = false} = props
  const [menuOpen, setMenuOpen] = useState<boolean>(false)
  const {scheme} = useColorScheme()
  const workspaces = useWorkspaces()
  const {activeWorkspace, setActiveWorkspace} = useActiveWorkspace()
  const [authStates] = useWorkspaceAuthStates(workspaces)
  const {navigateUrl} = useRouter()

  const handleOnOpen = useCallback(() => setMenuOpen(true), [])
  const handleOnClose = useCallback(() => setMenuOpen(false), [])

  const popoverProps: MenuButtonProps['popover'] = useMemo(
    () => ({constrainSize: true, scheme, portal: true}),
    [scheme],
  )
  //Tooltip should be disabled in the Navdrawer
  const tooltipDisabled = menuOpen || !collapsed
  const ariaLabel = collapsed ? TITLE : undefined
  const buttonText = collapsed ? undefined : TITLE

  return (
    <Tooltip
      content={
        <Box padding={2}>
          <Text size={1}>Select workspace</Text>
        </Box>
      }
      disabled={tooltipDisabled}
      placement="bottom"
      portal
      scheme={scheme}
    >
      <Stack>
        <MenuButton
          button={
            <Button
              icon={SelectIcon}
              mode="bleed"
              text={buttonText}
              disabled={!authStates}
              aria-label={ariaLabel}
              justify={collapsed ? undefined : 'flex-start'}
            />
          }
          id="workspace-menu"
          menu={
            <StyledMenu>
              <Box paddingX={3} paddingY={3}>
                <Label size={1} muted>
                  Workspaces
                </Label>
              </Box>

              {authStates &&
                workspaces.map((workspace) => {
                  const authState = authStates[workspace.name]

                  // eslint-disable-next-line no-nested-ternary
                  const state = authState.authenticated
                    ? 'logged-in'
                    : workspace.auth.LoginComponent
                    ? 'logged-out'
                    : 'no-access'

                  const handleSelectWorkspace = () => {
                    if (state === 'logged-in' && workspace.name !== activeWorkspace.name) {
                      setActiveWorkspace(workspace.name)
                    }

                    // Navigate to the base path of the workspace to authenticate
                    if (state === 'logged-out') {
                      navigateUrl({path: workspace.basePath})
                    }
                  }

                  return (
                    <MenuItem
                      key={workspace.name}
                      // eslint-disable-next-line react/jsx-no-bind
                      onClick={handleSelectWorkspace}
                      padding={2}
                      pressed={workspace.name === activeWorkspace.name}
                    >
                      <WorkspacePreview
                        icon={workspace?.icon}
                        selected={workspace.name === activeWorkspace.name}
                        state={state}
                        subtitle={workspace?.subtitle}
                        title={workspace?.title || workspace.name}
                      />
                    </MenuItem>
                  )
                })}
            </StyledMenu>
          }
          onClose={handleOnClose}
          onOpen={handleOnOpen}
          popover={popoverProps}
        />
      </Stack>
    </Tooltip>
  )
}
