import {CheckmarkIcon, SelectIcon} from '@sanity/icons'
import {MenuButton, Menu, MenuButtonProps} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {useActiveWorkspace} from '../../../activeWorkspaceMatcher'
import {useWorkspaces} from '../../../workspaces'
import {Button, MenuItem} from '../../../../../ui'
import {useWorkspaceAuthStates} from './hooks'
import {STATE_TITLES, WorkspacePreviewIcon} from './WorkspacePreview'
import {useRouter} from 'sanity/router'

const StyledMenu = styled(Menu)`
  max-width: 350px;
  min-width: 250px;
`

const TITLE = 'Select workspace'

const POPOVER_PROPS: MenuButtonProps['popover'] = {constrainSize: true}

interface WorkspaceMenuButtonProps {
  collapsed?: boolean
}

export function WorkspaceMenuButton(props: WorkspaceMenuButtonProps) {
  const {collapsed = false} = props
  const workspaces = useWorkspaces()
  const {activeWorkspace, setActiveWorkspace} = useActiveWorkspace()
  const [authStates] = useWorkspaceAuthStates(workspaces)
  const {navigateUrl} = useRouter()

  const ariaLabel = collapsed ? TITLE : undefined
  const buttonText = collapsed ? undefined : TITLE

  // @todo: fix an issue in Sanity UI <MenuButton> components where, when open with a selected item,
  // clicking the menu button causes the menu to close and immediately re-open.
  return (
    <MenuButton
      button={
        <Button
          icon={SelectIcon}
          mode="bleed"
          text={buttonText}
          disabled={!authStates}
          aria-label={ariaLabel}
          justify={collapsed ? undefined : 'flex-start'}
          size="small"
          tooltipProps={{content: 'Select workspace'}}
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
      popover={POPOVER_PROPS}
    />
  )
}
