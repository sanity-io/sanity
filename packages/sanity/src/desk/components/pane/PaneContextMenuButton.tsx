import {EllipsisVerticalIcon} from '@sanity/icons'
import {Box, Button, Label, Menu, MenuButton, MenuDivider, MenuItem, PopoverProps} from '@sanity/ui'
import React, {forwardRef, Fragment, useCallback, useMemo, useId} from 'react'
import {PaneMenuItem, PaneMenuItemGroup} from '../../types'
import {IntentLink} from 'sanity/router'

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
 *
 * @hidden
 * @beta This API will change. DO NOT USE IN PRODUCTION.
 */
export function PaneContextMenuButton(props: PaneContextMenuButtonProps) {
  const {items, itemGroups, onAction} = props
  const id = useId()

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
      button={<Button icon={EllipsisVerticalIcon} mode="bleed" padding={3} title="Show menu" />}
      id={id}
      menu={
        <Menu>
          {groups.map((group, groupIndex) => (
            // eslint-disable-next-line react/no-array-index-key
            <Fragment key={groupIndex}>
              {groupIndex > 0 && <MenuDivider />}
              {group.title && (
                <Box paddingX={3} paddingTop={3} paddingBottom={2}>
                  <Label muted>{group.title}</Label>
                </Box>
              )}
              {group.items.map((item, itemIndex) => (
                <PaneContextMenuItem
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

  const IntentButtonOrActionButton = forwardRef((linkProps, linkRef: React.ForwardedRef<never>) =>
    item.intent ? (
      <IntentLink
        {...linkProps}
        intent={item.intent.type}
        params={item.intent.params}
        ref={linkRef}
      />
    ) : (
      <MenuItem {...linkProps} pressed={item.selected} />
    )
  )

  IntentButtonOrActionButton.displayName = 'Link'

  return (
    <MenuItem
      as={IntentButtonOrActionButton}
      data-as={item.intent ? 'a' : 'button'}
      hotkeys={hotkeys}
      icon={item.icon}
      onClick={handleClick}
      padding={0}
      text={item.title}
    />
  )
}
