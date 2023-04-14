import {CheckmarkIcon, EllipsisVerticalIcon} from '@sanity/icons'
import {Box, Label, Menu, MenuButton, MenuDivider, MenuItem, PopoverProps} from '@sanity/ui'
import React, {Fragment, useCallback, useMemo, useId, MouseEvent} from 'react'
import {PaneMenuItem, PaneMenuItemGroup} from '../../types'
import {Intent} from '../../structureBuilder'
import {StatusButton} from 'sanity'
import {useIntentLink} from 'sanity/router'

interface PaneContextMenuButtonProps {
  items: PaneMenuItem[]
  itemGroups?: PaneMenuItemGroup[]
  onAction: (action: PaneMenuItem) => void
}

interface MenuItemGroup {
  id: string
  title?: React.ReactNode
  items: PaneMenuItem[]
}

const CONTEXT_MENU_POPOVER_PROPS: PopoverProps = {
  constrainSize: true,
  placement: 'bottom',
  portal: true,
  width: 0,
}

/**
 * @beta This API will change. DO NOT USE IN PRODUCTION.
 */
export function PaneContextMenuButton(props: PaneContextMenuButtonProps) {
  const {items, itemGroups, onAction} = props
  const id = useId()

  const hasCritical = items.some((item) => item.tone === 'critical')
  const hasCaution = items.some((item) => item.tone === 'caution')

  const groups = useMemo(() => {
    if (!itemGroups || itemGroups.length === 0) {
      return [{id: '$default', items}]
    }

    const defaultGroup: MenuItemGroup = {id: '$default', items: []}

    const groupMap = itemGroups.reduce((acc: Record<string, MenuItemGroup>, group) => {
      acc[group.id] = {id: group.id, title: group.title, items: []}
      return acc
    }, {})

    for (const item of items) {
      const group = groupMap[item.group || '$default'] || defaultGroup

      group.items.push(item)
    }

    return Object.values(groupMap)
      .concat([defaultGroup])
      .filter((g) => g.items.length > 0)
  }, [items, itemGroups])

  return (
    <MenuButton
      button={
        <StatusButton
          icon={EllipsisVerticalIcon}
          mode="bleed"
          title="Show menu"
          // eslint-disable-next-line no-nested-ternary
          tone={hasCritical ? 'critical' : hasCaution ? 'caution' : undefined}
        />
      }
      id={id}
      menu={
        <Menu>
          {groups.map((group, groupIndex) => (
            // eslint-disable-next-line react/no-array-index-key
            <Fragment key={groupIndex}>
              {groupIndex > 0 && <MenuDivider />}

              {group.title && (
                <Box padding={2} paddingBottom={1}>
                  <Label muted size={0}>
                    {group.title}
                  </Label>
                </Box>
              )}

              {group.items.map((item, itemIndex) => (
                <PaneContextMenuItemResolver
                  item={item}
                  // eslint-disable-next-line react/no-array-index-key
                  key={`${itemIndex}-${item.title}`}
                  onAction={onAction}
                />
              ))}
            </Fragment>
          ))}
        </Menu>
      }
      popover={CONTEXT_MENU_POPOVER_PROPS}
    />
  )
}

function PaneContextMenuItemResolver(props: {
  item: PaneMenuItem
  onAction: (action: PaneMenuItem) => void
}) {
  const {item} = props

  if (item.intent) {
    return <PaneContextIntentMenuItem {...props} intent={item.intent} />
  }

  return <PaneContextMenuItem {...props} />
}

function PaneContextMenuItem(props: {
  item: PaneMenuItem
  onAction: (action: PaneMenuItem) => void
}) {
  const {item, onAction} = props

  const handleClick = useCallback(() => {
    onAction(item)
  }, [item, onAction])

  const hotkeys = useMemo(() => {
    if (!item.shortcut) return undefined

    return item.shortcut.split('+')
  }, [item])

  return (
    <MenuItem
      hotkeys={hotkeys}
      icon={item.icon}
      iconRight={item.selected ? CheckmarkIcon : undefined}
      onClick={handleClick}
      selected={item.selected}
      text={item.title}
      tone={item.tone}
    />
  )
}

function PaneContextIntentMenuItem(props: {
  intent: Intent
  item: PaneMenuItem
  onAction: (action: PaneMenuItem) => void
}) {
  const {intent, item, onAction} = props
  const intentLink = useIntentLink({intent: intent.type, params: intent.params})

  const hotkeys = useMemo(() => {
    if (!item.shortcut) return undefined

    return item.shortcut.split('+')
  }, [item])

  const handleClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      intentLink.onClick(event)
      onAction(item)
    },
    [intentLink, item, onAction]
  )

  return (
    <MenuItem
      as="a"
      hotkeys={hotkeys}
      href={intentLink.href}
      icon={item.icon}
      iconRight={item.selected ? CheckmarkIcon : undefined}
      onClick={handleClick}
      pressed={item.selected}
      text={item.title}
    />
  )
}
