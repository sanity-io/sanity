import {CloseIcon} from '@sanity/icons/Close'
import {Card, Layer, usePortal} from '@sanity/ui'
import {type KeyboardEvent, memo, useCallback, useMemo, ViewTransition} from 'react'
import TrapFocus, {type ReactFocusLockProps} from 'react-focus-lock'
import {styled} from 'styled-components'
import {Text, Box, Flex, VStack} from 'ui5'

import {Button} from '../../../../../ui-components/button/Button'
import {CapabilityGate} from '../../../../components/CapabilityGate'
import {UserAvatar} from '../../../../components/userAvatar/UserAvatar'
import {useMountCommitted} from '../../../../components/viewTransition/useMountCommitted'
import {useViewTransitionValue} from '../../../../components/viewTransition/useViewTransitionValue'
import {useViewTransitionStyles} from '../../../../components/viewTransition/viewTransitionStyles'
import {type NavbarAction} from '../../../../config/studio/types'
import {type Tool} from '../../../../config/types'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {GlobalPerspectiveNav} from '../../../../perspective/navbar/GlobalPerspectiveNav'
import {studioViewTransitionClass} from '../../../../viewTransitions/transitionTypes'
import {useColorSchemeSetValue} from '../../../colorScheme'
import {useToolMenuComponent} from '../../../studio-components-hooks/useToolMenuComponent'
import {useWorkspace} from '../../../workspace'
import {useWorkspaces} from '../../../workspaces/useWorkspaces'
import {HomeButton} from '../home/HomeButton'
import {UserMenuAuthAction} from '../userMenu/UserMenuAuthAction'
import {WorkspaceMenuButton} from '../workspace/WorkspaceMenuButton'
import {AppearanceMenu} from './ApperanceMenu'
import {LocaleMenu} from './LocaleMenu'
import {ManageMenu} from './ManageMenu'
import {drawerFocusLock} from './NavDrawer.css'

/** The transition type of opening and closing the drawer */
const NAV_DRAWER_TRANSITION = 'sanity-nav-drawer'
const NAV_DRAWER_TYPES = [NAV_DRAWER_TRANSITION]

const BACKDROP_FADE = studioViewTransitionClass({
  default: 'none',
  [NAV_DRAWER_TRANSITION]: 'sanity-vt-fade',
})
const DRAWER_SLIDE = studioViewTransitionClass({
  default: 'none',
  [NAV_DRAWER_TRANSITION]: 'sanity-vt-drawer',
})

const Root = styled(Layer)`
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
`

const Backdrop = styled(Layer)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--card-shadow-penumbra-color);
`

const InnerCard = styled(Card)`
  position: relative;
  pointer-events: all;
  flex-direction: column;
  height: 100%;
  min-width: 200px;
  max-width: 280px;
  overflow: auto;
`

interface NavDrawerProps {
  __internal_actions?: NavbarAction[]
  activeToolName?: string
  isOpen: boolean
  onClose: () => void
  /** Renders the global perspective pickers, which the navbar leaves out on narrow screens. */
  showPerspectives?: boolean
  tools: Tool[]
}

export const NavDrawer = memo(function NavDrawer(props: NavDrawerProps) {
  const {
    __internal_actions: actions,
    activeToolName,
    isOpen,
    onClose,
    showPerspectives,
    tools,
  } = props

  const setScheme = useColorSchemeSetValue()
  const {currentUser} = useWorkspace()
  const workspaces = useWorkspaces()
  const ToolMenu = useToolMenuComponent()
  const portal = usePortal()

  const {t} = useTranslation()

  // Menus and dialogs opened from the drawer (the perspective pickers, the create release dialog)
  // render in the portal. Without this, tabbing inside such a dialog lets the lock pull focus
  // back into the drawer.
  const trapDrawerFocus: ReactFocusLockProps['whiteList'] = (interactionElement) =>
    !portal.element?.contains(interactionElement)

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        onClose()
      }
    },
    [onClose],
  )

  const handleActionClick = useCallback(
    (action: () => void) => {
      action?.()
      onClose()
    },
    [onClose],
  )

  // The drawer mounts already open, the first time it is opened. It slides in a commit after its
  // mount, like on every later open, and that mount does not insert its boundaries (see
  // `useMountCommitted`).
  const mountCommitted = useMountCommitted()
  const shown = useViewTransitionValue(isOpen && mountCommitted, NAV_DRAWER_TYPES)
  useViewTransitionStyles()

  const actionNodes = useMemo(() => {
    return actions
      ?.filter((v) => v.location === 'sidebar')
      ?.map((action) => {
        const {render: ActionComponent} = action

        if (ActionComponent) return <ActionComponent key={action.name} />

        return (
          <Button
            key={action.name}
            icon={action?.icon}
            justify="flex-start"
            mode="bleed"
            onClick={() => handleActionClick(action.onAction)}
            selected={action.selected}
            size="large"
            text={action.title}
            width="fill"
          />
        )
      })
  }, [actions, handleActionClick])

  if (!shown) return null

  // React only animates a `<ViewTransition>` in and out when no element above it mounts or
  // unmounts in the same commit, so each boundary is the outermost element of what it brings in:
  // the backdrop is a layer of its own, and the focus lock sits inside the drawer's layer.
  return (
    <>
      <ViewTransition default={BACKDROP_FADE}>
        <Backdrop data-open="true" data-testid="nav-drawer-backdrop" onClick={onClose} />
      </ViewTransition>
      <ViewTransition default={DRAWER_SLIDE}>
        <Root data-testid="nav-drawer" onKeyDown={handleKeyDown}>
          {/* `shown` lags `isOpen` so the drawer can slide out. Disable the lock on the urgent
              close, or it pulls focus back in for the whole exit. `returnFocus` then restores the
              menu button once the lock deactivates. */}
          <TrapFocus
            className={drawerFocusLock}
            disabled={!isOpen}
            returnFocus
            whiteList={trapDrawerFocus}
          >
            <InnerCard data-open="true" display="flex" height="fill" shadow={1}>
              <Card borderBottom>
                <Flex gap={3} padding={3} flexDirection="column">
                  <Flex alignItems="center">
                    {/* Current user */}
                    <Flex flexBasis="0%" flexGrow={1} alignItems="center" paddingRight={2}>
                      <CapabilityGate capability="globalUserMenu">
                        <Flex flexBasis="0%" flexGrow={1} alignItems="center">
                          <UserAvatar size={1} user="me" />
                          <Box
                            flexBasis="0%"
                            flexGrow={1}
                            marginLeft={3}
                            title={currentUser?.name || currentUser?.email}
                          >
                            <Text size={1} truncate={1} weight="medium" as="div" trim={true}>
                              {currentUser?.name || currentUser?.email}
                            </Text>
                          </Box>
                        </Flex>
                      </CapabilityGate>
                    </Flex>

                    <Button
                      icon={CloseIcon}
                      mode="bleed"
                      onClick={onClose}
                      tooltipProps={{content: t('user-menu.close-menu')}}
                    />
                  </Flex>

                  {workspaces.length > 1 && (
                    <Flex flexBasis="0%" flexGrow={1} gap={1}>
                      <HomeButton />
                      <WorkspaceMenuButton />
                    </Flex>
                  )}
                </Flex>
              </Card>

              {showPerspectives && (
                <Card borderBottom flex="none" padding={3}>
                  <Flex flexDirection="column" gap={2}>
                    <GlobalPerspectiveNav fullWidth />
                  </Flex>
                </Card>
              )}

              <Flex
                flexDirection="column"
                flexBasis="0%"
                flexGrow={1}
                justifyContent="space-between"
                overflow="auto"
              >
                {/* Tools */}
                <Card flex="none" padding={2}>
                  <ToolMenu
                    activeToolName={activeToolName}
                    closeSidebar={onClose}
                    context="sidebar"
                    isSidebarOpen={isOpen}
                    tools={tools}
                  />
                </Card>

                <Flex flexDirection="column">
                  {actionNodes && (
                    <Card flex="none" padding={2}>
                      <VStack gap={1}>{actionNodes}</VStack>
                    </Card>
                  )}

                  {setScheme && <AppearanceMenu setScheme={setScheme} />}
                  <LocaleMenu />
                  <CapabilityGate capability="globalUserMenu">
                    <ManageMenu />
                  </CapabilityGate>
                </Flex>
              </Flex>

              <CapabilityGate capability="globalUserMenu">
                <UserMenuAuthAction layout="drawer" />
              </CapabilityGate>
            </InnerCard>
          </TrapFocus>
        </Root>
      </ViewTransition>
    </>
  )
})
