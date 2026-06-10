import {ChevronDownIcon} from '@sanity/icons'
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
import {take} from 'rxjs/operators'

import {MenuButton, type MenuButtonProps, Tooltip} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {probeWorkspaceAuth} from '../../../../store/authStore/probeWorkspaceAuth'
import {useActiveWorkspace} from '../../../activeWorkspaceMatcher'
import {useVisibleWorkspaces} from '../../../workspaces'
import {ManageMenu} from './ManageMenu'
import {WorkspaceMenuItem} from './WorkspaceMenuItem'

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

  const stackRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const hasScroll = node.scrollHeight > node.clientHeight
      setScrollbarWidth(hasScroll ? node.offsetWidth - node.clientWidth : 0)
    }
  }, [])

  // Preload probes on hover/focus so the result is already buffered by the
  // time the user clicks. The probe's grace window keeps the cached value
  // alive across the transient subscribe/unsubscribe cycle from `take(1)`.
  const handlePreload = useCallback(() => {
    visibleWorkspaces.forEach((workspace) => {
      probeWorkspaceAuth({
        projectId: workspace.projectId,
        dataset: workspace.dataset,
        apiHost: workspace.apiHost,
      })
        .pipe(take(1))
        .subscribe()
    })
  }, [visibleWorkspaces])

  return (
    <MenuButton
      button={
        <Flex onPointerEnter={handlePreload} onFocus={handlePreload}>
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
      menu={
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
                  {visibleWorkspaces.map((workspace) => (
                    <WorkspaceMenuItem
                      key={workspace.name}
                      workspace={workspace}
                      isSelected={workspace.name === activeWorkspace.name}
                      scrollbarWidth={scrollbarWidth}
                    />
                  ))}
                </Stack>
              </Box>
            </>
          )}
        </Menu>
      }
      popover={POPOVER_PROPS}
    />
  )
}
