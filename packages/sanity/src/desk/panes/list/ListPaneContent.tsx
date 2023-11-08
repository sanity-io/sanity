import React, {useCallback} from 'react'
import {Box} from '@sanity/ui'
import styled from 'styled-components'
import {PaneContent, PaneItem, usePaneLayout} from '../../components'
import {PaneListItem, PaneListItemDivider} from '../../types'
import {CommandList, CommandListItemContext, GeneralPreviewLayoutKey} from 'sanity'

interface ListPaneContentProps {
  childItemId?: string
  isActive?: boolean
  items: (PaneListItem<unknown> | PaneListItemDivider)[] | undefined
  layout?: GeneralPreviewLayoutKey
  showIcons: boolean
  title: string
}

const Divider = styled.hr`
  background-color: var(--card-border-color);
  height: 1px;
  margin: 0;
  border: none;
`

/**
 * @internal
 */
export function ListPaneContent(props: ListPaneContentProps) {
  const {childItemId, items, isActive, layout, showIcons, title} = props
  const {collapsed: layoutCollapsed} = usePaneLayout()

  const getItemDisabled = useCallback(
    (itemIndex: number) => {
      return items?.find((_, i) => i === itemIndex)?.type === 'divider'
    },
    [items],
  )

  const shouldShowIconForItem = useCallback(
    (item: PaneListItem): boolean => {
      const itemShowIcon = item.displayOptions?.showIcon

      // Specific true/false on item should have precedence over list setting
      if (typeof itemShowIcon !== 'undefined') {
        return itemShowIcon !== false // Boolean(item.icon)
      }

      // If no item setting is defined, defer to the pane settings
      return showIcons !== false // Boolean(item.icon)
    },
    [showIcons],
  )

  const renderItem = useCallback(
    (item: PaneListItem<unknown> | PaneListItemDivider, ctx: CommandListItemContext) => {
      const {virtualIndex: itemIndex} = ctx

      if (item.type === 'divider') {
        return (
          // eslint-disable-next-line react/no-array-index-key
          <Box key={`divider-${itemIndex}`} marginBottom={1}>
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
          layout={layout}
          marginBottom={1}
          pressed={pressed}
          schemaType={item.schemaType}
          selected={selected}
          title={item.title}
          value={value}
        />
      )
    },
    [childItemId, isActive, layout, shouldShowIconForItem],
  )

  return (
    <PaneContent overflow={layoutCollapsed ? 'hidden' : 'auto'}>
      {items && items.length > 0 && (
        <CommandList
          activeItemDataAttr="data-hovered"
          ariaLabel={`List of ${title}`}
          canReceiveFocus
          focusRingOffset={-3}
          getItemDisabled={getItemDisabled}
          itemHeight={51}
          items={items}
          onlyShowSelectionWhenActive
          padding={2}
          paddingBottom={1}
          renderItem={renderItem}
          wrapAround={false}
        />
      )}
    </PaneContent>
  )
}
