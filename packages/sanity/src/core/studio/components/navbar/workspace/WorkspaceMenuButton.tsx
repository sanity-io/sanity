import {SelectIcon, CheckmarkIcon} from '@sanity/icons'
import {MenuButton, Menu, MenuButtonProps, Stack} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'
import styled from 'styled-components'
import {useActiveWorkspace} from '../../../activeWorkspaceMatcher'
import {useColorScheme} from '../../../colorScheme'
import {useWorkspaces} from '../../../workspaces'
import {Tooltip, Button, MenuItem} from '../../../../../ui'
import {useWorkspaceAuthStates} from './hooks'
import {STATE_TITLES, WorkspacePreviewIcon} from './WorkspacePreview'
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
      content="Select workspace"
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
                  const isSelected = workspace.name === activeWorkspace.name
                  return (
                    <MenuItem
                      key={workspace.name}
                      // eslint-disable-next-line react/jsx-no-bind
                      onClick={handleSelectWorkspace}
                      pressed={isSelected}
                      selected={isSelected}
                      iconRight={isSelected ? CheckmarkIcon : undefined}
                      badgeText={STATE_TITLES[state]}
                      preview={<WorkspacePreviewIcon icon={workspace.icon} size="large" />}
                      text={workspace?.title || workspace.name}
                      subtitle={workspace?.subtitle}
                    />
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
