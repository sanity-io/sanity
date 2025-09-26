import {CheckmarkIcon, ChevronDownIcon} from '@sanity/icons'
import {
  Box,
  // eslint-disable-next-line no-restricted-imports
  Button as UIButton,
  Flex,
  Menu,
  MenuDivider,
  Stack,
  Text,
} from '@sanity/ui'

import {MenuButton, type MenuButtonProps, MenuItem, Tooltip} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {useActiveWorkspace} from '../../../activeWorkspaceMatcher'
import {useWorkspaces} from '../../../workspaces'
import {useWorkspaceAuthStates} from './hooks'
import {ManageMenu} from './ManageMenu'
import {STATE_TITLES, WorkspacePreviewIcon} from './WorkspacePreview'

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
          <Menu padding={0} style={{maxWidth: '350px', minWidth: '250px', overflowY: 'hidden'}}>
            <ManageMenu multipleWorkspaces={workspaces.length > 1} />
            {workspaces.length > 1 && (
              <>
                <MenuDivider style={{padding: 0}} />
                <Box paddingTop={2} paddingBottom={1}>
                  <Box paddingRight={5} paddingLeft={4} paddingBottom={2}>
                    <Text size={0} weight="medium">
                      {t('workspaces.action.switch-workspace')}
                    </Text>
                  </Box>

                  <Stack space={1} style={{overflowY: 'auto', maxHeight: '40vh'}}>
                    {workspaces.map((workspace) => {
                      const authState = authStates[workspace.name]

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
                          key={workspace.name}
                          as="a"
                          href={workspace.basePath}
                          badgeText={STATE_TITLES[state]}
                          iconRight={isSelected ? CheckmarkIcon : undefined}
                          pressed={isSelected}
                          preview={<WorkspacePreviewIcon icon={workspace.icon} size="small" />}
                          selected={isSelected}
                          __unstable_subtitle={workspace.subtitle}
                          text={workspace?.title || workspace.name}
                          style={{marginLeft: '1.25rem', marginRight: '0.25rem'}}
                          __unstable_space={0}
                        />
                      )
                    })}
                  </Stack>
                </Box>
              </>
            )}
          </Menu>
        ) : undefined
      }
      popover={POPOVER_PROPS}
    />
  )
}
