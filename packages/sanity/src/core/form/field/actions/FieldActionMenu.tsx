/* eslint-disable react/jsx-handler-names */

import {EllipsisVerticalIcon} from '@sanity/icons'
import {Card, Flex, Menu, MenuButton, MenuButtonProps} from '@sanity/ui'
import React, {memo, useCallback, useId, useMemo, useState} from 'react'
import {StatusButton, StatusButtonProps} from '../../../components'
import {DocumentFieldActionGroup, DocumentFieldActionNode} from '../../../config'
import {supportsTouch} from '../../../util'
import {useFieldActions} from './useFieldActions'
import {FieldActionMenuNode} from './FieldActionMenuNode'

/** @internal */
export interface FieldActionMenuProps {
  focused: boolean | undefined
  nodes: DocumentFieldActionNode[]
}

const STATUS_BUTTON_TOOLTIP_PROPS: StatusButtonProps['tooltip'] = {
  placement: 'top',
}

function renderAsButton(node: DocumentFieldActionNode) {
  return 'renderAsButton' in node && node.renderAsButton
}

/** @internal */
export const FieldActionMenu = memo(function FieldActionMenu(props: FieldActionMenuProps) {
  const {focused, nodes} = props
  const {hovered} = useFieldActions()

  const [open, setOpen] = useState(false)

  const handleOpen = useCallback(() => setOpen(true), [])
  const handleClose = useCallback(() => setOpen(false), [])

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
      ...buttonNodes,
      ...(menuNodes.length
        ? ([
            {
              type: 'group',
              children: menuNodes,
              icon: EllipsisVerticalIcon,
              title: 'Field actions',
            },
          ] satisfies DocumentFieldActionNode[])
        : []),
    ],
    [buttonNodes, menuNodes],
  )

  const rootStyle = useMemo(
    () => ({height: 25, lineHeight: 0, display: open || focused || hovered ? undefined : 'none'}),
    [focused, hovered, open],
  )

  return (
    <Flex gap={1} style={rootStyle}>
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
    </Flex>
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
        fontSize={1}
        icon={node.icon}
        // Do not show tooltip if menu is open
        label={open ? undefined : node.title}
        mode={supportsTouch ? 'bleed' : 'ghost'}
        onClick={node.onAction}
        padding={2}
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
          fontSize={1}
          icon={node.icon}
          label={open ? undefined : node.title}
          mode={supportsTouch ? 'bleed' : 'ghost'}
          padding={2}
          tooltip={STATUS_BUTTON_TOOLTIP_PROPS}
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
