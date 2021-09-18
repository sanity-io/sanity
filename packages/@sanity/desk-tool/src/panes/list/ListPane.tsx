import React, {useCallback, useMemo, useState} from 'react'
import {Box, Button, Stack} from '@sanity/ui'
import {
  MenuItem as MenuItemType,
  MenuItemGroup as MenuItemGroupType,
} from '@sanity/base/__legacy/@sanity/components'
import styled from 'styled-components'
import {ArrowLeftIcon} from '@sanity/icons'
import {PaneContextMenuButton, Pane, PaneContent, PaneHeader, usePaneLayout} from '../../components'
import {PaneItem} from '../../components/paneItem'
import {useDeskTool} from '../../contexts/deskTool'
import {usePaneRouter} from '../../contexts/paneRouter'
import {BaseDeskToolPaneProps} from '../types'

interface ListPaneItem {
  id: string
  icon?: boolean
  type: string
  displayOptions?: {showIcon?: boolean}
  schemaType?: {name?: string}
}

type ListPaneProps = BaseDeskToolPaneProps<{
  defaultLayout?: 'inline' | 'block' | 'default' | 'card' | 'media' | 'detail'
  displayOptions?: {
    showIcons?: boolean
  }
  items?: ListPaneItem[]
  menuItems?: MenuItemType[]
  menuItemGroups?: MenuItemGroupType[]
  title: string
}>

const Divider = styled.hr`
  background-color: var(--card-border-color);
  height: 1px;
  margin: 0;
  border: none;
`

/**
 * @internal
 */
export function ListPane(props: ListPaneProps) {
  const {childItemId, index, isSelected, isActive, pane, paneKey} = props
  const {features} = useDeskTool()
  const {collapsed: layoutCollapsed} = usePaneLayout()
  const {BackLink} = usePaneRouter()

  const {
    defaultLayout,
    displayOptions = {},
    items = [],
    menuItems = [],
    menuItemGroups = [],
    title,
  } = pane

  const paneShowIcons = displayOptions.showIcons

  const itemIsSelected = useCallback(
    (item: ListPaneItem) => {
      return childItemId === item.id
    },
    [childItemId]
  )

  const shouldShowIconForItem = useCallback(
    (item: ListPaneItem) => {
      const itemShowIcon = item.displayOptions?.showIcon

      // Specific true/false on item should have presedence over list setting
      if (typeof itemShowIcon !== 'undefined') {
        return itemShowIcon === false ? false : item.icon
      }

      // If no item setting is defined, defer to the pane settings
      return paneShowIcons === false ? false : item.icon
    },
    [paneShowIcons]
  )

  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)

  const handleAction = useCallback((item: MenuItemType) => {
    if (typeof item.action === 'function') {
      item.action(item.params)
      return
    }

    if (typeof item.action === 'string') {
      // eslint-disable-next-line no-console
      console.warn('No handler for action:', item.action)
      return
    }

    // eslint-disable-next-line no-console
    console.warn('The menu item is missing the `action` property')
  }, [])

  const actions = useMemo(
    () =>
      menuItems.length > 0 && (
        <PaneContextMenuButton
          boundaryElement={rootElement}
          items={menuItems}
          itemGroups={menuItemGroups}
          onAction={handleAction}
        />
      ),
    [handleAction, menuItemGroups, menuItems, rootElement]
  )

  const header = useMemo(
    () => (
      <PaneHeader
        actions={actions}
        backButton={
          features.backButton &&
          index > 0 && <Button as={BackLink} data-as="a" icon={ArrowLeftIcon} mode="bleed" />
        }
        title={title}
      />
    ),
    [actions, BackLink, features.backButton, index, title]
  )

  const content = useMemo(
    () => (
      <PaneContent overflow={layoutCollapsed ? undefined : 'auto'}>
        <Stack padding={2} space={1}>
          {items.map((item) => {
            if (item.type === 'divider') {
              return (
                <Box key={item.id} paddingY={1}>
                  <Divider />
                </Box>
              )
            }

            return (
              <PaneItem
                icon={shouldShowIconForItem(item)}
                id={item.id}
                isActive={isActive}
                isSelected={itemIsSelected(item)}
                key={item.id}
                layout={defaultLayout}
                schemaType={item.schemaType}
                value={item}
              />
            )
          })}
        </Stack>
      </PaneContent>
    ),
    [defaultLayout, isActive, itemIsSelected, items, layoutCollapsed, shouldShowIconForItem]
  )

  return useMemo(
    () => (
      <Pane
        currentMaxWidth={350}
        data-index={index}
        data-pane-key={paneKey}
        data-testid="desk-tool-list-pane"
        maxWidth={640}
        minWidth={320}
        selected={isSelected}
        ref={setRootElement}
      >
        {header}
        {content}
      </Pane>
    ),
    [content, header, index, isSelected, paneKey]
  )
}
