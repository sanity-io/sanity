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
import {useCallback, useState} from 'react'

import {MenuButton, type MenuButtonProps, MenuItem, Tooltip} from '../../../../../ui-components'
import {LoadingBlock} from '../../../../components/loadingBlock'
import {useTranslation} from '../../../../i18n'
import {useActiveWorkspace} from '../../../activeWorkspaceMatcher'
import {useVisibleWorkspaces} from '../../../workspaces'
import {useWorkspaceAuthProbes} from './hooks'
import {ManageMenu} from './ManageMenu'
import {STATE_TITLES, WorkspacePreviewIcon} from './WorkspacePreview'

const POPOVER_PROPS: MenuButtonProps['popover'] = {
  constrainSize: true,
  fallbackPlacements: ['bottom-end', 'bottom'],
  placement: 'bottom-end',
  tone: 'default',
}

export function WorkspaceMenuButton() {
  const {visibleWorkspaces} = useVisibleWorkspaces()
  const {activeWorkspace} = useActiveWorkspace()
  const {t} = useTranslation()
  const [scrollbarWidth, setScrollbarWidth] = useState(0)

  // Defer the per-workspace auth probe until the menu is first opened.
  // The menu is hidden behind a popover; probing on mount fans out
  // /auth/id requests for every visible workspace before the user has
  // even asked to switch. Latch to `true` on first open so the data
  // stays warm if the user reopens the menu.
  const [hasOpened, setHasOpened] = useState(false)
  const handleOpen = useCallback(() => setHasOpened(true), [])

  const [authStates, isLoadingAuth] = useWorkspaceAuthProbes({
    workspaces: visibleWorkspaces,
    enabled: hasOpened,
  })

  const stackRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const hasScroll = node.scrollHeight > node.clientHeight
      setScrollbarWidth(hasScroll ? node.offsetWidth - node.clientWidth : 0)
    }
  }, [])

  const isProbing = hasOpened && (isLoadingAuth || !authStates)

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
        isProbing ? (
          <Menu padding={0} style={{maxWidth: '350px', minWidth: '250px', overflowY: 'hidden'}}>
            <LoadingBlock showText />
          </Menu>
        ) : authStates ? (
          <Menu padding={0} style={{maxWidth: '350px', minWidth: '250px', overflowY: 'hidden'}}>
            <ManageMenu multipleWorkspaces={visibleWorkspaces.length > 1} />
            {visibleWorkspaces.length > 1 && (
              <>
                <MenuDivider style={{padding: 0}} />
                <Box paddingTop={2} paddingBottom={1}>
                  <Box paddingRight={5} paddingLeft={4} paddingBottom={3}>
                    <Text size={0} weight="medium">
                      {t('workspaces.action.switch-workspace')}
                    </Text>
                  </Box>

                  <Stack ref={stackRef} space={1} style={{overflowY: 'auto', maxHeight: '40vh'}}>
                    {visibleWorkspaces.map((workspace) => {
                      const authState = authStates[workspace.name]

                      const state = authState.authenticated
                        ? 'logged-in'
                        : workspace.auth.LoginComponent
                          ? 'logged-out'
                          : 'no-access'

                      const isSelected = workspace.name === activeWorkspace.name

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
            )}
          </Menu>
        ) : undefined
      }
      popover={POPOVER_PROPS}
    />
  )
}
