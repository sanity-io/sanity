import {CheckmarkIcon, ChevronDownIcon} from '@sanity/icons'
import {
  Box,
  // eslint-disable-next-line no-restricted-imports
  Button as UIButton,
  Flex,
  Menu,
  MenuDivider,
  Spinner,
  Stack,
  Text,
} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {MenuButton, type MenuButtonProps, MenuItem, Tooltip} from '../../../../../ui-components'
import {type WorkspaceSummary} from '../../../../config'
import {useTranslation} from '../../../../i18n'
import {useActiveWorkspace} from '../../../activeWorkspaceMatcher'
import {useVisibleWorkspaces} from '../../../workspaces'
import {useWorkspaceAuthStates} from './hooks'
import {ManageMenu} from './ManageMenu'
import {STATE_TITLES, WorkspacePreviewIcon} from './WorkspacePreview'

const POPOVER_PROPS: MenuButtonProps['popover'] = {
  constrainSize: true,
  fallbackPlacements: ['bottom-end', 'bottom'],
  placement: 'bottom-end',
  tone: 'default',
}

/**
 * Renders the workspace list with auth states.
 * Extracted as a separate component so that `useWorkspaceAuthStates` is only
 * called (and auth-check network requests only fire) when this component is
 * mounted — i.e. after the user opens the workspace switcher for the first time.
 */
function WorkspaceMenuContent({
  workspaces,
  activeWorkspaceName,
}: {
  workspaces: WorkspaceSummary[]
  activeWorkspaceName: string
}) {
  const [authStates] = useWorkspaceAuthStates(workspaces)
  const {t} = useTranslation()
  const [scrollbarWidth, setScrollbarWidth] = useState(0)

  const stackRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const hasScroll = node.scrollHeight > node.clientHeight
      setScrollbarWidth(hasScroll ? node.offsetWidth - node.clientWidth : 0)
    }
  }, [])

  if (!authStates) {
    return (
      <Flex align="center" justify="center" padding={4}>
        <Spinner muted />
      </Flex>
    )
  }

  if (workspaces.length <= 1) return null

  return (
    <>
      <MenuDivider style={{padding: 0}} />
      <Box paddingTop={2} paddingBottom={1}>
        <Box paddingRight={5} paddingLeft={4} paddingBottom={3}>
          <Text size={0} weight="medium">
            {t('workspaces.action.switch-workspace')}
          </Text>
        </Box>

        <Stack ref={stackRef} space={1} style={{overflowY: 'auto', maxHeight: '40vh'}}>
          {workspaces.map((workspace) => {
            const authState = authStates[workspace.name]

            const state = authState.authenticated
              ? 'logged-in'
              : workspace.auth.LoginComponent
                ? 'logged-out'
                : 'no-access'

            const isSelected = workspace.name === activeWorkspaceName

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
                style={{
                  marginLeft: '1rem',
                  marginRight: `calc(1.25rem - ${scrollbarWidth}px)`,
                }}
                __unstable_space={0}
              />
            )
          })}
        </Stack>
      </Box>
    </>
  )
}

export function WorkspaceMenuButton() {
  const {visibleWorkspaces} = useVisibleWorkspaces()
  const {activeWorkspace} = useActiveWorkspace()
  const {t} = useTranslation()
  const [hasBeenOpened, setHasBeenOpened] = useState(false)

  const handleOpen = useCallback(() => {
    setHasBeenOpened(true)
  }, [])

  return (
    <MenuButton
      button={
        <Flex>
          <Tooltip content={t('workspaces.select-workspace-tooltip')} portal>
            <UIButton mode="bleed" padding={2} width="fill">
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
      onOpen={handleOpen}
      menu={
        <Menu padding={0} style={{maxWidth: '350px', minWidth: '250px', overflowY: 'hidden'}}>
          <ManageMenu multipleWorkspaces={visibleWorkspaces.length > 1} />
          {hasBeenOpened && (
            <WorkspaceMenuContent
              workspaces={visibleWorkspaces}
              activeWorkspaceName={activeWorkspace.name}
            />
          )}
        </Menu>
      }
      popover={POPOVER_PROPS}
    />
  )
}
