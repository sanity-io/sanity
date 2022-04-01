import {ComposeIcon, LeaveIcon, MoonIcon, SunIcon} from '@sanity/icons'
import {useRouter, useStateLink} from '@sanity/state-router'
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
import React, {createElement, useCallback, useMemo, useState} from 'react'
import {useAuth} from '../../../auth'
import {CollapseMenu, UserAvatar} from '../../../components'
import {useSanity} from '../../../sanity'
import {useStudio} from '../../useStudio'
import {GlobalSearch} from './GlobalSearch'
import {ToolButton} from './ToolButton'

export function Navbar(props: {activeToolName?: string}) {
  const {activeToolName} = props
  const {project} = useSanity()
  const {scheme, setScheme, spaces, tools} = useStudio()
  const {sources} = useSanity()
  const auth = useAuth()
  const {state: routerState} = useRouter()
  const hasSpaces = spaces ? spaces.length > 1 : false
  const [newDocumentDialogOpen, setNewDocumentDialogOpen] = useState(false)

  const rootState = useMemo(
    () => (hasSpaces && routerState.space ? {space: routerState.space} : {}),
    [hasSpaces, routerState.space]
  )

  const rootLink = useStateLink({state: rootState})

  const handleNewDocumentButtonClick = useCallback(() => {
    setNewDocumentDialogOpen(true)
  }, [])

  const handleNewDocumentDialogClose = useCallback(() => {
    setNewDocumentDialogOpen(false)
  }, [])

  const handleToggleScheme = useCallback(() => {
    setScheme((s) => (s === 'dark' ? 'light' : 'dark'))
  }, [setScheme])

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
            >
              {project.logo ? (
                createElement(project.logo, {'aria-label': project.name})
              ) : (
                <Text weight="bold">{project.name}</Text>
              )}
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
                    <UserAvatar userId="me" size={1} />
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
                    onClick={auth.logout}
                    text="Sign out"
                  />
                </Menu>
              }
              popover={useMemo(() => ({preventOverflow: true, portal: true}), [])}
            />
          </Box>
        </Flex>
      </Card>

      {newDocumentDialogOpen && (
        <Dialog
          header="New document"
          id="new-document-dialog"
          onClose={handleNewDocumentDialogClose}
          width={2}
        >
          <Stack padding={4} space={5}>
            {sources.map((source) => (
              <Stack key={source.name} space={3}>
                <Text>{source.title}</Text>
                <Grid columns={3} gap={3}>
                  {source.initialValueTemplates.map((template) => (
                    <Button key={template.id} mode="ghost" text={template.title} />
                  ))}
                </Grid>
              </Stack>
            ))}
          </Stack>
        </Dialog>
      )}
    </Layer>
  )
}
