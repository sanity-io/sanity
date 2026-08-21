import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {
  // oxlint-disable-next-line no-restricted-imports
  Button as UIButton,
  Flex,
  Stack,
  Text,
} from '@sanity/ui'
import {Menu, MenuDivider} from '@sanity/ui/menu'
import {useCallback, useState} from 'react'
import {take} from 'rxjs/operators'
import {Box} from 'ui5'

import {MenuButton, type MenuButtonProps} from '../../../../../ui-components/menuButton/MenuButton'
import {Tooltip} from '../../../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {probeWorkspaceAuth} from '../../../../store/authStore/probeWorkspaceAuth'
import {useActiveWorkspace} from '../../../activeWorkspaceMatcher/useActiveWorkspace'
import {useVisibleWorkspaces} from '../../../workspaces/useVisibleWorkspaces'
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
  const [mountMenuContent, setMountMenuContent] = useState(false)

  const stackRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const hasScroll = node.scrollHeight > node.clientHeight
      setScrollbarWidth(hasScroll ? node.offsetWidth - node.clientWidth : 0)
    }
  }, [])

  // Preload probes on hover/focus so the result is already buffered by the
  // time the user clicks. The probe's grace window keeps the cached value
  // alive across the transient subscribe/unsubscribe cycle from `take(1)`.
  //
  // This is also where the menu content gets mounted: from @sanity/ui v4,
  // closed popovers keep their children mounted (React `<Activity>`), which
  // would put the per-workspace `/auth/id` probes and the project/grants
  // requests in ManageMenu on the studio boot path. Hover/focus always
  // precedes the click that opens the menu, so mounting here keeps those
  // requests deferred to interaction intent without an empty first frame.
  const handlePreload = useCallback(() => {
    setMountMenuContent(true)
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

  // Fallback for opens that are not preceded by hover/focus (e.g. Safari does
  // not focus buttons on click): fires after the popover is shown, so the
  // content mounts a frame late rather than not at all.
  const handleOpen = useCallback(() => setMountMenuContent(true), [])

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
      onOpen={handleOpen}
      menu={
        <Menu padding={0} style={{maxWidth: '350px', minWidth: '250px', overflowY: 'hidden'}}>
          {mountMenuContent && <ManageMenu multipleWorkspaces={visibleWorkspaces.length > 1} />}
          {mountMenuContent && visibleWorkspaces.length > 1 && (
            <>
              <MenuDivider style={{padding: 0}} />
              <Box paddingTop={2} paddingBottom={1}>
                <Box paddingRight={5} paddingLeft={4} paddingBottom={3}>
                  <Text size={0} weight="medium">
                    {t('workspaces.action.switch-workspace')}
                  </Text>
                </Box>

                <Stack ref={stackRef} gap={1} style={{overflowY: 'auto', maxHeight: '40vh'}}>
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
