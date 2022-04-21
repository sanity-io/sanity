import {ComposeIcon, LeaveIcon, MoonIcon, SunIcon} from '@sanity/icons'
import {
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Grid,
  Layer,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  Stack,
  Text,
  Tooltip,
} from '@sanity/ui'
import React, {createElement, useCallback, useMemo, useState, isValidElement} from 'react'
import {isValidElementType} from 'react-is'
import {startCase} from 'lodash'
import {CollapseMenu} from '../../../components/collapseMenu'
import {UserAvatar} from '../../../components/UserAvatar'
import {useWorkspace} from '../../workspace'
import {useColorScheme} from '../../colorScheme'
import {IntentLink, useStateLink} from '../../../router'
import {GlobalSearch} from './GlobalSearch'
import {ToolButton} from './ToolButton'
import {NewDocumentDialog} from './NewDocumentDialog'

export function Navbar(props: {activeToolName?: string}) {
  const {activeToolName} = props
  const {
    name,
    tools,
    logo,
    unstable_sources: sources,
    __internal: {auth},
    ...workspace
  } = useWorkspace()
  const {scheme, setScheme} = useColorScheme()
  const [newDocumentDialogOpen, setNewDocumentDialogOpen] = useState(false)
  const rootLink = useStateLink({state: {}})

  const formattedName = typeof name === 'string' && name !== 'root' ? startCase(name) : null
  const title = workspace.title || formattedName || 'Studio'

  const handleNewDocumentButtonClick = useCallback(() => {
    setNewDocumentDialogOpen(true)
  }, [])

  const handleNewDocumentDialogClose = useCallback(() => {
    setNewDocumentDialogOpen(false)
  }, [])

  const handleToggleScheme = useCallback(() => {
    setScheme(scheme === 'dark' ? 'light' : 'dark')
  }, [scheme, setScheme])

  const rootLinkContent = (() => {
    if (isValidElementType(logo)) return createElement(logo)
    if (isValidElement(logo)) return logo
    return <Text weight="bold">{title}</Text>
  })()

  return (
    <Layer zOffset={100}>
      <Card scheme="dark" shadow={scheme === 'dark' ? 1 : undefined} style={{lineHeight: 0}}>
        <Flex>
          <Box padding={2}>
            <Button
              as="a"
              href={rootLink.href}
              mode="bleed"
              onClick={rootLink.handleClick}
              padding={3}
              aria-label={title}
            >
              {rootLinkContent}
            </Button>
          </Box>

          <Box flex={1} padding={2}>
            <CollapseMenu gap={1}>
              {tools.map((tool) => (
                <ToolButton key={tool.name} selected={activeToolName === tool.name} tool={tool} />
              ))}
            </CollapseMenu>
          </Box>
          <Box padding={2}>
            <Tooltip
              content={
                <Box padding={2}>
                  <Text size={1}>New document…</Text>
                </Box>
              }
              placement="bottom"
              portal
            >
              <Button
                aria-label="New document…"
                icon={ComposeIcon}
                mode="bleed"
                onClick={handleNewDocumentButtonClick}
              />
            </Tooltip>
          </Box>
          <Box padding={2}>
            <GlobalSearch />
          </Box>
          <Box padding={2}>
            <MenuButton
              button={
                <Button mode="bleed">
                  <div style={{margin: -12}}>
                    <UserAvatar user="me" size={1} />
                  </div>
                </Button>
              }
              id="user-menu"
              menu={
                <Menu>
                  <MenuItem
                    icon={scheme === 'dark' ? SunIcon : MoonIcon}
                    onClick={handleToggleScheme}
                    text={scheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  />
                  <MenuDivider />
                  <MenuItem
                    iconRight={LeaveIcon}
                    // mode="ghost"
                    // eslint-disable-next-line react/jsx-handler-names
                    onClick={auth.controller.logout}
                    text="Sign out"
                  />
                </Menu>
              }
              popover={useMemo(() => ({preventOverflow: true, portal: true}), [])}
            />
          </Box>
        </Flex>
      </Card>

      <NewDocumentDialog open={newDocumentDialogOpen} onClose={handleNewDocumentDialogClose} />
    </Layer>
  )
}
