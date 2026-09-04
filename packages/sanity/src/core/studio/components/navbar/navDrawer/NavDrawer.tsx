import {CloseIcon} from '@sanity/icons/Close'
import {Card, Layer, Stack, Text} from '@sanity/ui'
import {AnimatePresence, motion, type Transition, type Variants} from 'motion/react'
import {type KeyboardEvent, memo, useCallback, useMemo} from 'react'
import TrapFocus from 'react-focus-lock'
import {Flex, Box} from 'ui5'

import {Button} from '../../../../../ui-components/button/Button'
import {CapabilityGate} from '../../../../components/CapabilityGate'
import {UserAvatar} from '../../../../components/userAvatar/UserAvatar'
import {type NavbarAction} from '../../../../config/studio/types'
import {type Tool} from '../../../../config/types'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
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
import {backdrop, innerCard, root} from './NavDrawer.css'

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

const MotionCard = motion.create(Card)

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
  const {currentUser} = useWorkspace()
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

  return (
    <AnimatePresence>
      {isOpen && (
        <TrapFocus returnFocus>
          <Layer className={root} onKeyDown={handleKeyDown}>
            <MotionCard
              animate="open"
              className={backdrop}
              data-open={isOpen}
              exit="closed"
              initial="closed"
              onClick={onClose}
              transition={ANIMATION_TRANSITION}
              variants={BACKDROP_VARIANTS}
            />
            <MotionCard
              animate="open"
              className={innerCard}
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
                <Stack gap={3} padding={3}>
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
                    <Flex flexBasis="0%" flexGrow={1} gap={1}>
                      <HomeButton />
                      <WorkspaceMenuButton />
                    </Flex>
                  )}
                </Stack>
              </Card>

              <Flex
                flexDirection="column"
                flexBasis="0%"
                flexGrow={1}
                justifyContent="space-between"
                overflow="auto"
              >
                {/* Tools */}
                <Card flex="none" padding={2}>
                  {/* oxlint-disable-next-line react/static-components -- this is intentional and how the middleware components has to work */}
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
                      <Stack gap={1}>{actionNodes}</Stack>
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
            </MotionCard>
          </Layer>
        </TrapFocus>
      )}
    </AnimatePresence>
  )
})
