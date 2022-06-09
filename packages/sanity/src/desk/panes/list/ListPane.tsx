import React from 'react'
import {Box, Button, Card, Code, Stack} from '@sanity/ui'
import styled from 'styled-components'
import {ArrowLeftIcon} from '@sanity/icons'
import {PaneListItem} from '../../types'
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

  const shouldShowIconForItem = (item: PaneListItem): boolean => {
    const itemShowIcon = item.displayOptions?.showIcon

    // Specific true/false on item should have precedence over list setting
    if (typeof itemShowIcon !== 'undefined') {
      return itemShowIcon !== false // Boolean(item.icon)
    }

    // If no item setting is defined, defer to the pane settings
    return paneShowIcons !== false // Boolean(item.icon)
  }

  return (
    <Pane
      currentMaxWidth={350}
      data-testid="desk-tool-list-pane"
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
        title={title}
      />

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

              const pressed = !isActive && childItemId === item.id
              const selected = isActive && childItemId === item.id

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
    </Pane>
  )
}
