import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {Box, Button, Card, Code} from '@sanity/ui'
import styled from 'styled-components'
import {ArrowLeftIcon} from '@sanity/icons'
import {PaneListItem, PaneListItemDivider} from '../../types'
import {
  Pane,
  PaneContent,
  PaneHeader,
  usePaneLayout,
  PaneHeaderActions,
  BackLink,
  PaneItem,
} from '../../components'
import {BaseDeskToolPaneProps} from '../types'
import {_DEBUG} from '../../constants'
import {useDeskTool} from '../../useDeskTool'
import {useInputType} from '../../input-type'
import {CommandList, CommandListHandle, CommandListItemContext} from 'sanity'

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
  const [commandListRef, setCommandListRef] = useState<CommandListHandle | null>(null)

  const {features} = useDeskTool()
  const inputType = useInputType()

  const {collapsed: layoutCollapsed, panes} = usePaneLayout()
  const {defaultLayout, displayOptions, items, menuItems, menuItemGroups, title} = pane
  const paneShowIcons = displayOptions?.showIcons

  const isOnlyPane = index === 0 && panes.length === 1
  const tabIndex = isOnlyPane ? -1 : 0

  // The index of the selected item in the list.
  // This is used as the initial index for the virtual list so
  // that the selected item is scrolled into view.
  const selectedIndex = useMemo(() => {
    return items
      ?.filter((item) => item.type === 'listItem')
      .findIndex((item) => item.type === 'listItem' && item?.id === childItemId)
  }, [childItemId, items])

  // Focus the list when it is opened
  useEffect(() => {
    if (commandListRef && index !== 0 && (items || [])?.length > 0) {
      commandListRef.focusElement()
    }
  }, [index, selectedIndex, items, commandListRef])

  const shouldShowIconForItem = useCallback(
    (item: PaneListItem): boolean => {
      const itemShowIcon = item.displayOptions?.showIcon

      // Specific true/false on item should have precedence over list setting
      if (typeof itemShowIcon !== 'undefined') {
        return itemShowIcon !== false // Boolean(item.icon)
      }

      // If no item setting is defined, defer to the pane settings
      return paneShowIcons !== false // Boolean(item.icon)
    },
    [paneShowIcons]
  )

  const getItemDisabled = useCallback(
    (itemIndex: number) => {
      return items?.find((_, i) => i === itemIndex)?.type === 'divider'
    },
    [items]
  )

  const renderItem = useCallback(
    (item: PaneListItem<unknown> | PaneListItemDivider, ctx: CommandListItemContext) => {
      const {virtualIndex: itemIndex} = ctx

      if (item.type === 'divider') {
        return (
          // eslint-disable-next-line react/no-array-index-key
          <Box key={`divider-${itemIndex}`} marginTop={1} marginBottom={2}>
            <Divider />
          </Box>
        )
      }

      const pressed = !isActive && childItemId === item.id
      const selected = isActive && childItemId === item.id
      // If this is a document list item, pass on the ID and type,
      // otherwise leave it undefined to use the passed title and gang
      const value =
        item._id && item.schemaType
          ? {_id: item._id, _type: item.schemaType.name, title: item.title}
          : undefined

      return (
        <PaneItem
          icon={shouldShowIconForItem(item) ? item.icon : false}
          id={item.id}
          key={item.id}
          layout={defaultLayout}
          marginBottom={1}
          pressed={pressed}
          schemaType={item.schemaType}
          selected={selected}
          title={item.title}
          value={value}
        />
      )
    },
    [childItemId, defaultLayout, isActive, shouldShowIconForItem]
  )

  return (
    <Pane
      currentMaxWidth={350}
      data-testid="desk-tool-list-pane"
      data-ui="ListPane"
      id={paneKey}
      maxWidth={640}
      minWidth={320}
      selected={isSelected}
    >
      {_DEBUG && (
        <Card padding={4} tone="transparent">
          <Code>{pane.source || '(none)'}</Code>
        </Card>
      )}

      <PaneHeader
        actions={<PaneHeaderActions menuItems={menuItems} menuItemGroups={menuItemGroups} />}
        backButton={
          features.backButton &&
          index > 0 && <Button as={BackLink} data-as="a" icon={ArrowLeftIcon} mode="bleed" />
        }
        tabIndex={tabIndex}
        title={title}
      />

      <PaneContent overflow={layoutCollapsed ? undefined : 'auto'}>
        {items && items.length > 0 && (
          <CommandList
            activeItemDataAttr="data-hovered"
            ariaLabel={`List of ${title}`}
            disableActivateOnHover
            focusVisible={inputType === 'keyboard'}
            getItemDisabled={getItemDisabled}
            initialIndex={selectedIndex}
            initialScrollAlign="end"
            itemHeight={51}
            items={items}
            padding={2}
            paddingBottom={1}
            ref={setCommandListRef}
            renderItem={renderItem}
            tabIndex={0}
            wrapAround={false}
          />
        )}
      </PaneContent>
    </Pane>
  )
}
