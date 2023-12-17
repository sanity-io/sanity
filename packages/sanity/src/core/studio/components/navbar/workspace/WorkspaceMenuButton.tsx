import {CheckmarkIcon, ChevronDownIcon} from '@sanity/icons'
import {
  Box,
  // eslint-disable-next-line no-restricted-imports
  Button,
  Menu,
  Flex,
  Card,
  Text,
} from '@sanity/ui'
import React, {useMemo} from 'react'
import styled from 'styled-components'
import {useTranslation} from '../../../../i18n'
import {useActiveWorkspace} from '../../../activeWorkspaceMatcher'
import {useWorkspaces} from '../../../workspaces'
import {MenuButton, MenuButtonProps, MenuItem} from '../../../../ui-components'
import {SanityLogo} from '../SanityLogo'
import {useWorkspaceAuthStates} from './hooks'
import {STATE_TITLES, WorkspacePreviewIcon} from './WorkspacePreview'
import {useRouter, useStateLink} from 'sanity/router'

const StyledMenu = styled(Menu)`
  max-width: 350px;
  min-width: 250px;
`

const LOGO_MARK_SIZE = 25 // width and height, px

const POPOVER_PROPS: MenuButtonProps['popover'] = {constrainSize: true}

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

  // TODO: add conditional tooltip
  const button = useMemo(() => {
    return (
      <Button
        aria-label={
          multipleWorkspaces ? t('workspaces.select-workspace-aria-label') : activeWorkspace.title
        }
        disabled={!authStates}
        href={multipleWorkspaces ? undefined : rootHref}
        onClick={multipleWorkspaces ? undefined : handleRootClick}
        mode="bleed"
        padding={0}
        paddingRight={2}
      >
        <Flex align="center" gap={2}>
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
          <Box>
            <Text size={1} weight="medium">
              {activeWorkspace.title}
            </Text>
          </Box>
          {multipleWorkspaces && (
            <Text size={1}>
              <ChevronDownIcon />
            </Text>
          )}
        </Flex>
      </Button>
    )
  }, [
    activeWorkspace.customIcon,
    activeWorkspace.icon,
    activeWorkspace.title,
    authStates,
    handleRootClick,
    multipleWorkspaces,
    rootHref,
    t,
  ])

  if (!multipleWorkspaces) {
    return button
  }

  // @todo: fix an issue in Sanity UI <MenuButton> components where, when open with a selected item,
  // clicking the menu button causes the menu to close and immediately re-open.
  return (
    <>
      <MenuButton
        button={button}
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
    </>
  )
}
