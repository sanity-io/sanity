/* eslint-disable react/jsx-handler-names */

import {EllipsisHorizontalIcon} from '@sanity/icons'
import {Card, Menu} from '@sanity/ui'
import {memo, useCallback, useId, useMemo, useState} from 'react'

import {Button, type ButtonProps, MenuButton, type MenuButtonProps} from '../../../../ui-components'
import {type DocumentFieldActionGroup, type DocumentFieldActionNode} from '../../../config'
import {useI18nText} from '../../../i18n'
import {FieldActionMenuNode} from './FieldActionMenuNode'

/** @internal */
export interface FieldActionMenuProps {
  nodes: DocumentFieldActionNode[]
  onMenuOpenChange: (open: boolean) => void
}

const STATUS_BUTTON_TOOLTIP_PROPS: ButtonProps['tooltipProps'] = {
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
          // oxlint-disable-next-line no-array-index-key
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
      <Button
        icon={node.icon}
        mode="bleed"
        onClick={node.onAction}
        tooltipProps={{
          ...STATUS_BUTTON_TOOLTIP_PROPS,
          content: node.title,
        }}
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
  const {title} = useI18nText(node)

  return (
    <MenuButton
      button={
        <Button
          aria-label={open ? undefined : title}
          data-testid="field-actions-trigger"
          icon={node.icon}
          mode="bleed"
          tabIndex={0}
          tooltipProps={{
            ...STATUS_BUTTON_TOOLTIP_PROPS,
            content: node.title,
          }}
        />
      }
      id={useId()}
      menu={
        <Menu>
          {node.children.map((action, idx) => {
            return (
              <FieldActionMenuNode
                // oxlint-disable-next-line no-array-index-key
                key={idx}
                action={action}
                isFirst={idx === 0}
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
