import React, {useCallback, useMemo} from 'react'
import {ArrowLeftIcon, UnknownIcon} from '@sanity/icons'
import {Box, Button, Inline, Text, Tooltip} from '@sanity/ui'
import {PaneMenuItem, PaneMenuItemGroup, DeskToolPaneActionHandler} from '../../types'
import {IntentButton} from '../../components/IntentButton'
import {PaneContextMenuButton, PaneHeader, usePane} from '../../components/pane'
import {useDeskTool} from '../../contexts/deskTool'
import {BackLink} from '../../contexts/paneRouter'
import {useDeskToolPaneActions} from '../useDeskToolPaneActions'

interface UserComponentPaneHeaderProps {
  actionHandlers?: Record<string, DeskToolPaneActionHandler>
  index: number
  menuItems?: PaneMenuItem[]
  menuItemGroups?: PaneMenuItemGroup[]
  title: string
}

export function UserComponentPaneHeader(props: UserComponentPaneHeaderProps) {
  const {actionHandlers, index, menuItems: menuItemsProp, menuItemGroups, title} = props
  const {collapsed} = usePane()
  const {features} = useDeskTool()

  const handleAction = useCallback(
    (item: PaneMenuItem) => {
      let handler: PaneMenuItem['action'] | null = null

      if (typeof item.action === 'function') {
        handler = item.action
      } else if (typeof item.action === 'string') {
        handler = actionHandlers && actionHandlers[item.action]
      }

      if (typeof handler === 'function') {
        handler(item.params)
      } else {
        // eslint-disable-next-line no-console
        console.warn('No handler defined for action:', item.action)
      }
    },
    [actionHandlers]
  )

  const {actionItems, menuItems} = useDeskToolPaneActions({
    collapsed,
    menuItems: menuItemsProp,
  })

  const contextMenu = useMemo(() => {
    if (menuItems.length === 0) return null

    return (
      <PaneContextMenuButton
        items={menuItems}
        itemGroups={menuItemGroups}
        key="$contextMenu"
        onAction={handleAction}
      />
    )
  }, [handleAction, menuItems, menuItemGroups])

  const actions = useMemo(() => {
    if (actionItems.length === 0 && !contextMenu) return null

    const actionButtons = actionItems.map((action, actionIndex) => {
      if (action.intent) {
        return (
          <Tooltip
            content={
              <Box padding={2}>
                <Text size={1}>{action.title}</Text>
              </Box>
            }
            disabled={!action.title}
            key={action.key || actionIndex}
            placement="bottom"
          >
            <IntentButton
              aria-label={String(action.title)}
              icon={action.icon || UnknownIcon}
              intent={action.intent}
              key={action.key || actionIndex}
              mode="bleed"
            />
          </Tooltip>
        )
      }

      return (
        <Tooltip
          content={
            <Box padding={2}>
              <Text size={1}>{action.title}</Text>
            </Box>
          }
          disabled={!action.title}
          key={action.key || actionIndex}
          placement="bottom"
        >
          <Button
            aria-label={String(action.title)}
            icon={action.icon || UnknownIcon}
            key={action.key || actionIndex}
            mode="bleed"
            onClick={() => handleAction(action)}
          />
        </Tooltip>
      )
    })

    return <Inline space={1}>{[...actionButtons, contextMenu]}</Inline>
  }, [actionItems, contextMenu, handleAction])

  if (!actions && !title) {
    return null
  }

  return (
    <PaneHeader
      actions={actions}
      backButton={
        features.backButton &&
        index > 0 && <Button as={BackLink} data-as="a" icon={ArrowLeftIcon} mode="bleed" />
      }
      title={title}
    />
  )
}
