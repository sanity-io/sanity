import {CheckmarkIcon, ChevronDownIcon} from '@sanity/icons'
import {
  Box,
  // eslint-disable-next-line no-restricted-imports
  Button as UIButton,
  Flex,
  Menu,
  Text,
} from '@sanity/ui'
import {useRouter} from 'sanity/router'
import {styled} from 'styled-components'

import {MenuButton, type MenuButtonProps, MenuItem, Tooltip} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {useActiveWorkspace} from '../../../activeWorkspaceMatcher'
import {useWorkspaces} from '../../../workspaces'
import {useWorkspaceAuthStates} from './hooks'
import {STATE_TITLES, WorkspacePreviewIcon} from './WorkspacePreview'

const StyledMenu = styled(Menu)`
  max-width: 350px;
  min-width: 250px;
`

const POPOVER_PROPS: MenuButtonProps['popover'] = {
  constrainSize: true,
  fallbackPlacements: ['bottom-end', 'bottom'],
  placement: 'bottom-end',
}

export function WorkspaceMenuButton() {
  const workspaces = useWorkspaces()
  const {activeWorkspace, setActiveWorkspace} = useActiveWorkspace()
  const [authStates] = useWorkspaceAuthStates(workspaces)
  const {navigateUrl} = useRouter()
  const {t} = useTranslation()

  const multipleWorkspaces = workspaces.length > 1

  if (!multipleWorkspaces) {
    return null
  }

  const disabled = !authStates

  return (
    <MenuButton
      button={
        <Flex>
          <Tooltip content={t('workspaces.select-workspace-tooltip')} disabled={disabled} portal>
            <UIButton disabled={disabled} mode="bleed" padding={2} width="fill">
              <Flex align="center" gap={2}>
                <Box>
                  <Text size={1} textOverflow="ellipsis" weight="medium">
                    {activeWorkspace.title}
                  </Text>
                </Box>
                <Text size={1}>
                  <ChevronDownIcon />
                </Text>
              </Flex>
            </UIButton>
          </Tooltip>
        </Flex>
      }
      id="workspace-menu"
      menu={
        !disabled && authStates ? (
          <StyledMenu>
            {workspaces.map((workspace) => {
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
                  __unstable_subtitle={workspace.subtitle}
                  __unstable_space={1}
                  text={workspace?.title || workspace.name}
                />
              )
            })}
          </StyledMenu>
        ) : undefined
      }
      popover={POPOVER_PROPS}
    />
  )
}
