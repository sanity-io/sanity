import {Box, Text} from '@sanity/ui'
import {useCallback} from 'react'
import {
  CommandList,
  type CommandListItemContext,
  type GeneralPreviewLayoutKey,
  useGetI18nText,
  useI18nText,
} from 'sanity'
import {styled} from 'styled-components'

import {PaneContent, PaneItem, usePaneLayout} from '../../components'
import {type PaneListItem, type PaneListItemDivider} from '../../types'

interface ListPaneContentProps {
  childItemId?: string
  isActive?: boolean
  items: (PaneListItem<unknown> | PaneListItemDivider)[] | undefined
  layout?: GeneralPreviewLayoutKey
  showIcons: boolean
  title: string
}

const DividerContainer = styled(Box)`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 0.75rem 0 0.25rem 0;
`

const Divider = styled.hr`
  flex: 1;
  background-color: var(--card-border-color);
  height: 1px;
  margin: 0;
  border: none;
`

const DividerTitle = styled(Text)`
  padding-bottom: 0.75rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
`

interface DividerItemProps {
  item: PaneListItemDivider
}

function DividerItem({item}: DividerItemProps) {
  const {title: dividerTitle} = useI18nText(item)
  return (
    <DividerContainer>
      <DividerTitle weight="semibold" muted size={1}>
        {dividerTitle}
      </DividerTitle>

      <Divider />
    </DividerContainer>
  )
}

/**
 * @internal
 */
export function ListPaneContent(props: ListPaneContentProps) {
  const {childItemId, items, isActive, layout, showIcons, title} = props
  const {collapsed: layoutCollapsed} = usePaneLayout()
  const getI18nText = useGetI18nText(
    items?.filter(
      (item): item is Exclude<typeof item, {type: 'divider'}> => item.type !== 'divider',
    ),
  )

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
          <Box key={`divider-${itemIndex}`} marginBottom={1}>
            {item.title ? <DividerItem item={item} /> : <Divider />}
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
          key={item.id}
          icon={shouldShowIconForItem(item) ? item.icon : false}
          id={item.id}
          layout={layout}
          marginBottom={1}
          pressed={pressed}
          schemaType={item.schemaType}
          selected={selected}
          title={getI18nText(item).title}
          value={value}
        />
      )
    },
    [childItemId, getI18nText, isActive, layout, shouldShowIconForItem],
  )

  return (
    <PaneContent overflow={layoutCollapsed ? 'hidden' : 'auto'}>
      {items && items.length > 0 && (
        <CommandList
          activeItemDataAttr="data-hovered"
          ariaLabel={title}
          canReceiveFocus
          getItemDisabled={getItemDisabled}
          itemHeight={51}
          items={items}
          onlyShowSelectionWhenActive
          paddingBottom={1}
          paddingX={3}
          renderItem={renderItem}
          wrapAround={false}
        />
      )}
    </PaneContent>
  )
}
