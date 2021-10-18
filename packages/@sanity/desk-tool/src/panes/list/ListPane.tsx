import React, {useCallback, useMemo} from 'react'
import {Box, Button, Stack} from '@sanity/ui'
import styled from 'styled-components'
import {ArrowLeftIcon} from '@sanity/icons'
import {PaneListItem, PaneMenuItem} from '../../types'
import {PaneContextMenuButton, Pane, PaneContent, PaneHeader, usePaneLayout} from '../../components'
import {PaneItem} from '../../components/paneItem'
import {useDeskTool} from '../../contexts/deskTool'
import {BackLink} from '../../contexts/paneRouter'
import {BaseDeskToolPaneProps} from '../types'

type ListPaneProps = BaseDeskToolPaneProps<'list'>

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
  const {childItemId, index, isActive, isSelected, pane, paneKey} = props
  const {features} = useDeskTool()
  const {collapsed: layoutCollapsed} = usePaneLayout()
  const {defaultLayout, displayOptions, items, menuItems, menuItemGroups, title} = pane

  const paneShowIcons = displayOptions?.showIcons

  const itemIsSelected = useCallback((item: PaneListItem) => childItemId === item.id, [childItemId])

  const shouldShowIconForItem = useCallback(
    (item: PaneListItem): boolean => {
      const itemShowIcon = item.displayOptions?.showIcon

      // Specific true/false on item should have presedence over list setting
      if (typeof itemShowIcon !== 'undefined') {
        return itemShowIcon !== false // Boolean(item.icon)
      }

      // If no item setting is defined, defer to the pane settings
      return paneShowIcons !== false // Boolean(item.icon)
    },
    [paneShowIcons]
  )

  const handleAction = useCallback((item: PaneMenuItem) => {
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
      menuItems &&
      menuItems.length > 0 && (
        <PaneContextMenuButton
          items={menuItems}
          itemGroups={menuItemGroups}
          onAction={handleAction}
        />
      ),
    [handleAction, menuItemGroups, menuItems]
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
    [actions, features.backButton, index, title]
  )

  const content = useMemo(
    () => (
      <PaneContent overflow={layoutCollapsed ? undefined : 'auto'}>
        <Stack padding={2} space={1}>
          {items &&
            items.map((item, itemIndex) => {
              if (item.type === 'divider') {
                return (
                  // eslint-disable-next-line react/no-array-index-key
                  <Box key={`divider-${itemIndex}`} paddingY={1}>
                    <Divider />
                  </Box>
                )
              }

              const _isSelected = itemIsSelected(item)
              const pressed = !isActive && _isSelected
              const selected = isActive && _isSelected

              return (
                <PaneItem
                  icon={shouldShowIconForItem(item) ? item.icon : false}
                  id={item.id}
                  key={item.id}
                  layout={defaultLayout}
                  pressed={pressed}
                  schemaType={item.schemaType}
                  selected={selected}
                  title={item.title}
                  value={
                    // If this is a document list item, pass on the ID and type,
                    // otherwise leave it undefined to use the passed title and gang
                    item._id && item.schemaType
                      ? {_id: item._id, _type: item.schemaType.name, title: item.title}
                      : undefined
                  }
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
      >
        {header}
        {content}
      </Pane>
    ),
    [content, header, index, isSelected, paneKey]
  )
}
