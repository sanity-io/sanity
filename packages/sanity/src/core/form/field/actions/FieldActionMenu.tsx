/* eslint-disable react/jsx-handler-names */

import {EllipsisHorizontalIcon} from '@sanity/icons'
import {Card, Menu, MenuButton, MenuButtonProps} from '@sanity/ui'
import React, {memo, useCallback, useId, useMemo, useState} from 'react'
import {StatusButton, StatusButtonProps} from '../../../components'
import {DocumentFieldActionGroup, DocumentFieldActionNode} from '../../../config'
import {FieldActionMenuNode} from './FieldActionMenuNode'

/** @internal */
export interface FieldActionMenuProps {
  nodes: DocumentFieldActionNode[]
  onMenuOpenChange: (open: boolean) => void
}

const STATUS_BUTTON_TOOLTIP_PROPS: StatusButtonProps['tooltip'] = {
  placement: 'top',
}

function renderAsButton(node: DocumentFieldActionNode) {
  return 'renderAsButton' in node && node.renderAsButton
}

/** @internal */
export const FieldActionMenu = memo(function FieldActionMenu(props: FieldActionMenuProps) {
  const {nodes, onMenuOpenChange} = props
  const [open, setOpen] = useState(false)

  const handleOpen = useCallback(() => {
    onMenuOpenChange(true)
    setOpen(true)
  }, [onMenuOpenChange])
  const handleClose = useCallback(() => {
    onMenuOpenChange(false)
    setOpen(false)
  }, [onMenuOpenChange])

  const buttonNodes = useMemo(() => nodes.filter(renderAsButton), [nodes])
  const menuNodesProp = useMemo(() => nodes.filter((node) => !renderAsButton(node)), [nodes])

  // If there is only one menu node, and it is a `group`, expand it by default
  const menuNodes = useMemo(() => {
    const len = menuNodesProp.length

    if (len === 0 || len > 1) return menuNodesProp

    const node = menuNodesProp[0]

    if (node.type === 'group') {
      return [{...node, expanded: true}]
    }

    return menuNodesProp
  }, [menuNodesProp])

  const rootNodes: DocumentFieldActionNode[] = useMemo(
    () => [
      ...(menuNodes.length
        ? ([
            {
              type: 'group',
              children: menuNodes,
              icon: EllipsisHorizontalIcon,
              title: 'Field actions',
            },
          ] satisfies DocumentFieldActionNode[])
        : []),
      ...buttonNodes,
    ],
    [buttonNodes, menuNodes],
  )

  return (
    <>
      {rootNodes.map((node, idx) => (
        <RootFieldActionMenuNode
          // eslint-disable-next-line react/no-array-index-key
          key={idx}
          node={node}
          onOpen={handleOpen}
          onClose={handleClose}
          open={open}
        />
      ))}
    </>
  )
})

const RootFieldActionMenuNode = memo(function RootFieldActionMenuNode(props: {
  node: DocumentFieldActionNode
  onOpen: () => void
  onClose: () => void
  open: boolean
}) {
  const {node, onOpen, onClose, open} = props

  if (node.type === 'divider') {
    return <Card borderLeft flex="none" />
  }

  if (node.type === 'action') {
    return (
      <StatusButton
        icon={node.icon}
        // Do not show tooltip if menu is open
        label={open ? undefined : node.title}
        mode="bleed"
        size="small"
        onClick={node.onAction}
        tooltip={STATUS_BUTTON_TOOLTIP_PROPS}
      />
    )
  }

  return <RootFieldActionMenuGroup node={node} onOpen={onOpen} onClose={onClose} open={open} />
})

const ROOT_MENU_BUTTON_POPOVER_PROPS: MenuButtonProps['popover'] = {
  constrainSize: true,
  placement: 'right',
  portal: true,
  fallbackPlacements: ['top', 'bottom'],
}

function RootFieldActionMenuGroup(props: {
  node: DocumentFieldActionGroup
  onOpen: () => void
  onClose: () => void
  open: boolean
}) {
  const {node, onOpen, onClose, open} = props

  return (
    <MenuButton
      button={
        <StatusButton
          icon={node.icon}
          label={open ? undefined : node.title}
          mode="bleed"
          tooltip={STATUS_BUTTON_TOOLTIP_PROPS}
          size="small"
        />
      }
      id={useId()}
      menu={
        <Menu>
          {node.children.map((action, idx) => {
            return (
              <FieldActionMenuNode
                action={action}
                isFirst={idx === 0}
                // eslint-disable-next-line react/no-array-index-key
                key={idx}
                prevIsGroup={node.children[idx - 1]?.type === 'group'}
              />
            )
          })}
        </Menu>
      }
      onOpen={onOpen}
      onClose={onClose}
      popover={ROOT_MENU_BUTTON_POPOVER_PROPS}
    />
  )
}
