import {CheckmarkIcon, ChevronDownIcon} from '@sanity/icons'
import {
  Box,
  // eslint-disable-next-line no-restricted-imports
  Button as UIButton,
  Card,
  Flex,
  Menu,
  Text,
} from '@sanity/ui'
import styled from 'styled-components'
import {useTranslation} from '../../../../i18n'
import {useActiveWorkspace} from '../../../activeWorkspaceMatcher'
import {useWorkspaces} from '../../../workspaces'
import {Button, MenuButton, MenuButtonProps, MenuItem} from '../../../../../ui-components'
import {SanityLogo} from '../SanityLogo'
import {useWorkspaceAuthStates} from './hooks'
import {STATE_TITLES, WorkspacePreviewIcon} from './WorkspacePreview'
import {useRouter, useStateLink} from 'sanity/router'

const StyledMenu = styled(Menu)`
  max-width: 350px;
  min-width: 250px;
`

const LOGO_MARK_SIZE = 25 // width and height, px

const POPOVER_PROPS: MenuButtonProps['popover'] = {
  constrainSize: true,
  fallbackPlacements: ['bottom-end', 'bottom'],
  placement: 'bottom-end',
}

const LogoMarkContainer = styled(Card).attrs({
  overflow: 'hidden',
  radius: 2,
})`
  height: ${LOGO_MARK_SIZE}px;
  width: ${LOGO_MARK_SIZE}px;
`

export function WorkspaceMenuButton() {
  const workspaces = useWorkspaces()
  const {activeWorkspace, setActiveWorkspace} = useActiveWorkspace()
  const [authStates] = useWorkspaceAuthStates(workspaces)
  const {navigateUrl} = useRouter()
  const {t} = useTranslation()

  const multipleWorkspaces = workspaces.length > 1

  const {href: rootHref, onClick: handleRootClick} = useStateLink({state: {}})

  return (
    <Flex gap={1}>
      {/*
        Home / root button:
        - 1 workspace: Sanity logo + active workspace title
        - n workspaces: Workspace logo only
      */}
      <UIButton as="a" href={rootHref} mode="bleed" onClick={handleRootClick} padding={0}>
        <Flex align="center">
          <LogoMarkContainer>
            <Flex align="center" height="fill" justify="center">
              {/* Display the Sanity logo only if one workspace is active and no custom icon is defined */}
              {multipleWorkspaces || activeWorkspace.customIcon ? (
                <WorkspacePreviewIcon icon={activeWorkspace.icon} size="small" />
              ) : (
                <SanityLogo />
              )}
            </Flex>
          </LogoMarkContainer>
          {!multipleWorkspaces && (
            <Box paddingX={2}>
              <Text size={1} weight="medium">
                {activeWorkspace.title}
              </Text>
            </Box>
          )}
        </Flex>
      </UIButton>

      {/* Workspace selector / active workspace title */}
      {multipleWorkspaces && (
        <MenuButton
          button={
            <Button
              disabled={!authStates}
              iconRight={ChevronDownIcon}
              mode="bleed"
              text={activeWorkspace.title}
              tooltipProps={{content: t('workspaces.select-workspace-aria-label')}}
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
                      badgeText={STATE_TITLES[state]}
                      iconRight={isSelected ? CheckmarkIcon : undefined}
                      key={workspace.name}
                      // eslint-disable-next-line react/jsx-no-bind
                      onClick={handleSelectWorkspace}
                      pressed={isSelected}
                      preview={<WorkspacePreviewIcon icon={workspace.icon} size="small" />}
                      selected={isSelected}
                      text={workspace?.title || workspace.name}
                      tooltipProps={
                        workspace?.subtitle
                          ? {
                              content: workspace.subtitle,
                              placement: 'right',
                            }
                          : undefined
                      }
                    />
                  )
                })}
            </StyledMenu>
          }
          popover={POPOVER_PROPS}
        />
      )}
    </Flex>
  )
}
