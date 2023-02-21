import {
  Layer,
  Card,
  Flex,
  Text,
  Box,
  Button,
  Stack,
  useGlobalKeyDown,
  Label,
  useRootTheme,
} from '@sanity/ui'
import {CheckmarkIcon, CloseIcon, CogIcon, LeaveIcon} from '@sanity/icons'
import React, {memo, useEffect, useState} from 'react'
import styled from 'styled-components'
import {useWorkspace} from '../../workspace'
import {Tool} from '../../../config'
import {useToolMenuComponent} from '../../studio-components-hooks'
import {UserAvatar, useRovingFocus} from '../../../components'
import {useWorkspaces} from '../../workspaces'
import {useColorScheme} from '../../colorScheme'
import {StudioTheme} from '../../../theme'
import {WorkspaceMenuButton} from './workspace'

const Root = styled(Layer)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`

const Backdrop = styled(Card)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--card-shadow-penumbra-color);
  transition: 200ms opacity ease-in-out;
  pointer-events: none;
  opacity: 0;

  &[data-open='true'] {
    opacity: 1;
    pointer-events: all;
  }
`

const InnerCard = styled(Card)`
  position: relative;
  pointer-events: all;
  flex-direction: column;
  min-width: 200px;
  max-width: 280px;
  transition: 200ms transform ease-in-out;
  transform: translate3d(calc(-100% - 1px), 0, 0);

  &[data-open='true'] {
    transform: translate3d(0, 0, 0);
  }
`

interface NavDrawerProps {
  activeToolName?: string
  isOpen: boolean
  onClose: () => void
  tools: Tool[]
}

const PADDING = [3, 3, 4]

export const NavDrawer = memo(function NavDrawer(props: NavDrawerProps) {
  const {colorSchemeOptions} = useColorScheme()
  const {activeToolName, isOpen, onClose, tools} = props
  const [closeButtonElement, setCloseButtonElement] = useState<HTMLButtonElement | null>(null)
  const [innerCardElement, setInnerCardElement] = useState<HTMLDivElement | null>(null)
  const tabIndex = isOpen ? 0 : -1
  const {auth, currentUser, projectId} = useWorkspace()
  const workspaces = useWorkspaces()
  const theme = useRootTheme().theme as StudioTheme

  useRovingFocus({
    rootElement: innerCardElement,
    navigation: ['tab'],
  })

  useGlobalKeyDown((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      onClose()
    }
  })

  useEffect(() => {
    if (isOpen) {
      closeButtonElement?.focus()
    }
  }, [closeButtonElement, isOpen])

  const ToolMenu = useToolMenuComponent()

  return (
    <Root>
      <Backdrop data-open={isOpen} onClick={onClose} />

      <InnerCard
        display="flex"
        height="fill"
        data-open={isOpen}
        shadow={1}
        ref={setInnerCardElement}
      >
        <Card borderBottom>
          <Stack space={3} padding={PADDING}>
            <Flex align="center">
              <Flex flex={1} align="center" paddingRight={2}>
                <Flex flex={1} align="center">
                  <Box>
                    <UserAvatar size={1} user="me" />
                  </Box>

                  <Box flex={1} marginLeft={2} title={currentUser?.name || currentUser?.email}>
                    <Text textOverflow="ellipsis">{currentUser?.name || currentUser?.email}</Text>
                  </Box>
                </Flex>
              </Flex>

              <Box>
                <Button
                  icon={CloseIcon}
                  mode="bleed"
                  onClick={onClose}
                  ref={setCloseButtonElement}
                  tabIndex={tabIndex}
                  title="Close menu"
                />
              </Box>
            </Flex>

            {workspaces.length > 1 && (
              <WorkspaceMenuButton text="Select workspace" justify="flex-start" />
            )}
          </Stack>
        </Card>

        <Flex direction="column" flex={1} justify="space-between" overflow="auto">
          {/* Tools */}
          <Card padding={PADDING} overflow="auto">
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
            <Card borderTop padding={PADDING} overflow="auto">
              <Stack as="ul" space={1}>
                <Box padding={2}>
                  <Label size={1} muted>
                    Appearance
                  </Label>
                </Box>

                {!theme.__legacy &&
                  colorSchemeOptions.map((option, key) => (
                    <Stack as="li" key={key}>
                      <Button
                        as="a"
                        aria-label={`Use ${option} appearance`}
                        icon={option.icon}
                        iconRight={option.selected && <CheckmarkIcon />}
                        key={option.name}
                        mode="bleed"
                        justify="flex-start"
                        tabIndex={0}
                        onClick={() => option.onSelect()}
                        selected={option.selected}
                        text={option.title}
                      />
                    </Stack>
                  ))}
              </Stack>
            </Card>
            <Card borderTop padding={PADDING}>
              <Stack as="li">
                <Button
                  as="a"
                  aria-label="Manage project"
                  justify="flex-start"
                  mode="bleed"
                  tabIndex={tabIndex}
                  href={`https://sanity.io/manage/project/${projectId}`}
                  target="_blank"
                  text="Manage project"
                  icon={CogIcon}
                />
              </Stack>
            </Card>
          </Flex>
        </Flex>

        {auth.logout && (
          <Card flex="none" padding={PADDING} borderTop>
            <Stack>
              <Button
                iconRight={LeaveIcon}
                justify="flex-start"
                mode="bleed"
                // eslint-disable-next-line react/jsx-handler-names
                onClick={auth.logout}
                tabIndex={tabIndex}
                text="Sign out"
              />
            </Stack>
          </Card>
        )}
      </InnerCard>
    </Root>
  )
})
