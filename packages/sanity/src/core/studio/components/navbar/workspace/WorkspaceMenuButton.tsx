import {SelectIcon} from '@sanity/icons'
import {
  Button,
  MenuButton,
  MenuItem,
  Menu,
  MenuButtonProps,
  ButtonProps,
  Box,
  Label,
} from '@sanity/ui'
import React, {useMemo} from 'react'
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

export function WorkspaceMenuButton(props: ButtonProps) {
  const {scheme} = useColorScheme()
  const workspaces = useWorkspaces()
  const {activeWorkspace, setActiveWorkspace} = useActiveWorkspace()
  const [authStates] = useWorkspaceAuthStates(workspaces)
  const {navigateUrl} = useRouter()

  const popoverProps: MenuButtonProps['popover'] = useMemo(
    () => ({constrainSize: true, scheme, portal: true}),
    [scheme]
  )

  return (
    <MenuButton
      button={<Button icon={SelectIcon} mode="bleed" {...props} disabled={!authStates} />}
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
      popover={popoverProps}
    />
  )
}
