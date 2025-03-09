import {CheckmarkIcon, ChevronDownIcon} from '@sanity/icons'
import {
  Box,
  // eslint-disable-next-line no-restricted-imports
  Button as UIButton,
  Flex,
  Menu,
  Text,
} from '@sanity/ui'
import {styled} from 'styled-components'

import {MenuButton, type MenuButtonProps, MenuItem, Tooltip} from '../../../../../ui-components'
import {CapabilityGate} from '../../../../components/CapabilityGate'
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
  tone: 'default',
}

export function WorkspaceMenuButton() {
  const workspaces = useWorkspaces()
  const {activeWorkspace} = useActiveWorkspace()
  const [authStates] = useWorkspaceAuthStates(workspaces)
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
                <CapabilityGate capability="globalWorkspaceControl">
                  <Text size={1}>
                    <ChevronDownIcon />
                  </Text>
                </CapabilityGate>
              </Flex>
            </UIButton>
          </Tooltip>
        </Flex>
      }
      id="workspace-menu"
      menu={
        !disabled && authStates ? (
          <CapabilityGate capability="globalWorkspaceControl">
            <StyledMenu>
              {workspaces.map((workspace) => {
                const authState = authStates[workspace.name]

                // eslint-disable-next-line no-nested-ternary
                const state = authState.authenticated
                  ? 'logged-in'
                  : workspace.auth.LoginComponent
                    ? 'logged-out'
                    : 'no-access'

                const isSelected = workspace.name === activeWorkspace.name

                // we have a temporary need to make a hard direct link to the workspace
                // because of possibly shared context between workspaces. When this is resolved,
                // we can remove this and use setActiveWorkspace instead
                return (
                  <MenuItem
                    as="a"
                    href={workspace.basePath}
                    badgeText={STATE_TITLES[state]}
                    iconRight={isSelected ? CheckmarkIcon : undefined}
                    key={workspace.name}
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
          </CapabilityGate>
        ) : undefined
      }
      popover={POPOVER_PROPS}
    />
  )
}
