import {CloseIcon, LeaveIcon} from '@sanity/icons'
import {Box, Card, Flex, Layer, Stack, Text} from '@sanity/ui'
import {AnimatePresence, motion, type Transition, type Variants} from 'framer-motion'
import {type KeyboardEvent, memo, useCallback, useMemo} from 'react'
import TrapFocus from 'react-focus-lock'
import {styled} from 'styled-components'

import {Button} from '../../../../../ui-components'
import {UserAvatar} from '../../../../components'
import {CapabilityGate} from '../../../../components/CapabilityGate'
import {type NavbarAction, type Tool} from '../../../../config'
import {useTranslation} from '../../../../i18n'
import {useColorSchemeSetValue} from '../../../colorScheme'
import {useToolMenuComponent} from '../../../studio-components-hooks'
import {useWorkspace} from '../../../workspace'
import {useWorkspaces} from '../../../workspaces'
import {HomeButton} from '../home/HomeButton'
import {WorkspaceMenuButton} from '../workspace'
import {AppearanceMenu} from './ApperanceMenu'
import {LocaleMenu} from './LocaleMenu'
import {ManageMenu} from './ManageMenu'

const ANIMATION_TRANSITION: Transition = {
  bounce: 0,
  damping: 20,
  mass: 0.5,
  stiffness: 200,
  type: 'spring',
}

const BACKDROP_VARIANTS: Variants = {
  open: {
    opacity: 1,
  },
  closed: {
    opacity: 0,
  },
}

const INNER_CARD_VARIANTS: Variants = {
  open: {
    x: '0%',
  },
  closed: {
    x: '-100%',
  },
}

const Root = styled(Layer)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`

const BackdropMotion = styled(motion.create(Card))`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--card-shadow-penumbra-color);
`

const InnerCardMotion = styled(motion.create(Card))`
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
  tools: Tool[]
}

export const NavDrawer = memo(function NavDrawer(props: NavDrawerProps) {
  const {__internal_actions: actions, activeToolName, isOpen, onClose, tools} = props

  const setScheme = useColorSchemeSetValue()
  const {auth, currentUser} = useWorkspace()
  const workspaces = useWorkspaces()
  const ToolMenu = useToolMenuComponent()

  const {t} = useTranslation()

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

  const actionNodes = useMemo(() => {
    return actions
      ?.filter((v) => v.location === 'sidebar')
      ?.map((action) => {
        const {render: ActionComponent} = action

        if (ActionComponent) return <ActionComponent key={action.name} />

        return (
          <Button
            icon={action?.icon}
            justify="flex-start"
            key={action.name}
            mode="bleed"
            // eslint-disable-next-line react/jsx-no-bind
            onClick={() => handleActionClick(action.onAction)}
            selected={action.selected}
            size="large"
            text={action.title}
            width="fill"
          />
        )
      })
  }, [actions, handleActionClick])

  return (
    <AnimatePresence>
      {isOpen && (
        <TrapFocus returnFocus>
          <Root onKeyDown={handleKeyDown}>
            <BackdropMotion
              animate="open"
              data-open={isOpen}
              exit="closed"
              initial="closed"
              onClick={onClose}
              transition={ANIMATION_TRANSITION}
              variants={BACKDROP_VARIANTS}
            />
            <InnerCardMotion
              animate="open"
              data-open={isOpen}
              display="flex"
              exit="closed"
              height="fill"
              initial="closed"
              shadow={1}
              transition={ANIMATION_TRANSITION}
              variants={INNER_CARD_VARIANTS}
            >
              <Card borderBottom>
                <Stack space={3} padding={3}>
                  <Flex align="center">
                    {/* Current user */}
                    <Flex flex={1} align="center" paddingRight={2}>
                      <CapabilityGate capability="globalUserMenu">
                        <Flex flex={1} align="center">
                          <UserAvatar size={1} user="me" />
                          <Box
                            flex={1}
                            marginLeft={3}
                            title={currentUser?.name || currentUser?.email}
                          >
                            <Text size={1} textOverflow="ellipsis" weight="medium">
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
                    <Flex flex={1} gap={1}>
                      <HomeButton />
                      <WorkspaceMenuButton />
                    </Flex>
                  )}
                </Stack>
              </Card>

              <Flex direction="column" flex={1} justify="space-between" overflow="auto">
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

                <Flex direction="column">
                  {actionNodes && (
                    <Card flex="none" padding={2}>
                      <Stack space={1}>{actionNodes}</Stack>
                    </Card>
                  )}

                  {setScheme && <AppearanceMenu setScheme={setScheme} />}
                  <LocaleMenu />
                  <ManageMenu />
                </Flex>
              </Flex>

              {auth.logout && (
                <Card flex="none" padding={2} borderTop>
                  <Stack>
                    <Button
                      iconRight={LeaveIcon}
                      justify="flex-start"
                      mode="bleed"
                      // eslint-disable-next-line react/jsx-handler-names
                      onClick={auth.logout}
                      size="large"
                      text={t('user-menu.action.sign-out')}
                    />
                  </Stack>
                </Card>
              )}
            </InnerCardMotion>
          </Root>
        </TrapFocus>
      )}
    </AnimatePresence>
  )
})
