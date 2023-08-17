import {Layer, Card, Flex, Text, Box, Button, Stack, Label} from '@sanity/ui'
import {
  CheckmarkIcon,
  CloseIcon,
  CogIcon,
  LeaveIcon,
  UsersIcon,
  HelpCircleIcon,
  CommentIcon,
} from '@sanity/icons'
import React, {memo, useCallback} from 'react'
import styled from 'styled-components'
import TrapFocus from 'react-focus-lock'
import {AnimatePresence, motion, Transition, Variants} from 'framer-motion'
import {useWorkspace} from '../../workspace'
import {Tool} from '../../../config'
import {useToolMenuComponent} from '../../studio-components-hooks'
import {UserAvatar} from '../../../components'
import {useWorkspaces} from '../../workspaces'
import {useColorSchemeOptions, useColorSchemeSetValue} from '../../colorScheme'
import {StudioThemeColorSchemeKey} from '../../../theme'
import {userHasRole} from '../../../util/userHasRole'
import {WorkspaceMenuButton} from './workspace'

const ANIMATION_TRANSITION: Transition = {
  duration: 0.2,
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

const Backdrop = styled(motion(Card))`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--card-shadow-penumbra-color);
`

const InnerCard = styled(motion(Card))`
  position: relative;
  pointer-events: all;
  flex-direction: column;
  height: 100%;
  min-width: 200px;
  max-width: 280px;
  overflow: auto;
`

function AppearanceMenu({setScheme}: {setScheme: (nextScheme: StudioThemeColorSchemeKey) => void}) {
  // Subscribe to just what we need, if the menu isn't shown then we're not subscribed to these contexts
  const options = useColorSchemeOptions(setScheme)

  return (
    <>
      <Card borderTop flex="none" padding={3} overflow="auto">
        <Box padding={2}>
          <Label size={1} muted>
            Appearance
          </Label>
        </Box>

        <Stack as="ul" marginTop={1} space={1}>
          {options.map(({icon, label, name, onSelect, selected, title}) => (
            <Stack as="li" key={name}>
              <Button
                aria-label={label}
                icon={icon}
                iconRight={selected && <CheckmarkIcon />}
                justify="flex-start"
                mode="bleed"
                onClick={onSelect}
                selected={selected}
                text={title}
              />
            </Stack>
          ))}
        </Stack>
      </Card>
    </>
  )
}

interface NavDrawerProps {
  activeToolName?: string
  isOpen: boolean
  onClose: () => void
  tools: Tool[]
}

export const NavDrawer = memo(function NavDrawer(props: NavDrawerProps) {
  const {activeToolName, isOpen, onClose, tools} = props

  const setScheme = useColorSchemeSetValue()
  const {auth, currentUser, projectId} = useWorkspace()
  const workspaces = useWorkspaces()
  const ToolMenu = useToolMenuComponent()

  const isAdmin = Boolean(currentUser && userHasRole(currentUser, 'administrator'))

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        onClose()
      }
    },
    [onClose],
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <TrapFocus autoFocus returnFocus>
          <Root onKeyDown={handleKeyDown}>
            <Backdrop
              animate="open"
              data-open={isOpen}
              exit="closed"
              initial="closed"
              onClick={onClose}
              transition={ANIMATION_TRANSITION}
              variants={BACKDROP_VARIANTS}
            />
            <InnerCard
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
                    <Flex flex={1} align="center" paddingRight={2}>
                      <Flex flex={1} align="center">
                        <Box>
                          <UserAvatar size={1} user="me" />
                        </Box>

                        <Box
                          flex={1}
                          marginLeft={2}
                          title={currentUser?.name || currentUser?.email}
                        >
                          <Text textOverflow="ellipsis">
                            {currentUser?.name || currentUser?.email}
                          </Text>
                        </Box>
                      </Flex>
                    </Flex>

                    <Box>
                      <Button icon={CloseIcon} mode="bleed" onClick={onClose} title="Close menu" />
                    </Box>
                  </Flex>

                  {workspaces.length > 1 && (
                    <WorkspaceMenuButton text="Select workspace" justify="flex-start" />
                  )}
                </Stack>
              </Card>

              <Flex direction="column" flex={1} justify="space-between" overflow="auto">
                {/* Tools */}
                <Card flex="none" padding={3}>
                  <ToolMenu
                    activeToolName={activeToolName}
                    closeSidebar={onClose}
                    context="sidebar"
                    isSidebarOpen={isOpen}
                    tools={tools}
                  />
                </Card>

                {/* Theme picker and Manage */}
                <Flex direction="column">
                  {setScheme && <AppearanceMenu setScheme={setScheme} />}
                  <Card borderTop flex="none" padding={3}>
                    <Stack as="ul" space={1}>
                      <Stack as="li">
                        <Button
                          aria-label="Manage project"
                          as="a"
                          href={`https://sanity.io/manage/project/${projectId}`}
                          icon={CogIcon}
                          justify="flex-start"
                          mode="bleed"
                          target="_blank"
                          text="Manage project"
                        />
                      </Stack>

                      {isAdmin && (
                        <Stack as="li">
                          <Button
                            aria-label="Invite members"
                            as="a"
                            href={`https://sanity.io/manage/project/${projectId}/members`}
                            icon={UsersIcon}
                            justify="flex-start"
                            mode="bleed"
                            target="_blank"
                            text="Invite members"
                          />
                        </Stack>
                      )}
                    </Stack>
                  </Card>
                </Flex>
              </Flex>

              {auth.logout && (
                <Card flex="none" padding={3} borderTop>
                  <Stack>
                    <Button
                      iconRight={LeaveIcon}
                      justify="flex-start"
                      mode="bleed"
                      // eslint-disable-next-line react/jsx-handler-names
                      onClick={auth.logout}
                      text="Sign out"
                    />
                  </Stack>
                </Card>
              )}
            </InnerCard>
          </Root>
        </TrapFocus>
      )}
    </AnimatePresence>
  )
})
