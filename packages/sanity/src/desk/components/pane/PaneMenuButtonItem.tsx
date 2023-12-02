import {CheckmarkIcon} from '@sanity/icons'
import {MenuDivider, PopoverProps, Text} from '@sanity/ui'
import React, {useCallback, MouseEvent} from 'react'
import {Intent} from '../../structureBuilder'
import {MenuGroup, MenuItem} from '../../../ui'
import {_PaneMenuItem, _PaneMenuNode} from './types'
import {TooltipOfDisabled} from 'sanity'
import {useIntentLink} from 'sanity/router'

const MENU_GROUP_POPOVER_PROPS: PopoverProps = {
  constrainSize: true,
  placement: 'left-start',
  portal: true,
}

export function PaneMenuButtonItem(props: {
  disabled?: boolean
  isAfterGroup: boolean
  node: _PaneMenuNode
}) {
  const {disabled, isAfterGroup, node} = props

  if (node.type === 'divider') {
    return <MenuDivider />
  }

  if (node.type === 'group') {
    if (node.children.length === 0) {
      return null
    }

    if (node.expanded) {
      return (
        <>
          {isAfterGroup && <MenuDivider />}
          {node.children.map((child, childIndex) => (
            <PaneMenuButtonItem
              disabled={disabled || Boolean(node.disabled)}
              isAfterGroup={node.children[childIndex - 1]?.type === 'group'}
              key={child.key}
              node={child}
            />
          ))}
        </>
      )
    }

    return (
      <>
        {isAfterGroup && <MenuDivider />}
        <MenuGroup
          disabled={disabled}
          icon={node.icon}
          popover={MENU_GROUP_POPOVER_PROPS}
          text={node.title}
        >
          {node.children.map((child, childIndex) => (
            <PaneMenuButtonItem
              disabled={disabled || Boolean(node.disabled)}
              isAfterGroup={node.children[childIndex - 1]?.type === 'group'}
              key={child.key}
              node={child}
            />
          ))}
        </MenuGroup>
      </>
    )
  }

  return (
    <>
      {isAfterGroup && <MenuDivider />}
      <PaneContextMenuItemResolver disabled={disabled} node={node} />
    </>
  )
}

function PaneContextMenuItemResolver(props: {disabled?: boolean; node: _PaneMenuItem}) {
  const {node} = props

  if (node.intent) {
    return <PaneContextIntentMenuItem {...props} intent={node.intent} />
  }

  return <PaneContextMenuItem {...props} />
}

function PaneContextMenuItem(props: {disabled?: boolean; node: _PaneMenuItem}) {
  const {disabled, node} = props
  const tooltipContent = typeof node.disabled === 'object' && (
    <Text size={1}>{node.disabled.reason}</Text>
  )

  return (
    <TooltipOfDisabled content={tooltipContent} placement="left">
      <MenuItem
        disabled={disabled || Boolean(node.disabled)}
        hotkeys={node.hotkey?.split('+')}
        icon={node.icon}
        iconRight={node.iconRight || (node.selected && CheckmarkIcon)}
        // eslint-disable-next-line react/jsx-handler-names
        onClick={node.onAction}
        pressed={node.selected}
        text={node.title}
        tone={node.tone}
      />
    </TooltipOfDisabled>
  )
}

function PaneContextIntentMenuItem(props: {
  disabled?: boolean
  intent: Intent
  node: _PaneMenuItem
}) {
  const {disabled, intent, node} = props
  const tooltipContent = typeof node.disabled === 'object' && (
    <Text size={1}>{node.disabled.reason}</Text>
  )
  const intentLink = useIntentLink({intent: intent.type, params: intent.params})

  const handleClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      intentLink.onClick(event)
      node.onAction()
    },
    [intentLink, node],
  )

  return (
    <TooltipOfDisabled content={tooltipContent} placement="left">
      <MenuItem
        as="a"
        disabled={disabled || Boolean(node.disabled)}
        hotkeys={node.hotkey?.split('+')}
        href={intentLink.href}
        icon={node.icon}
        iconRight={node.selected ? CheckmarkIcon : undefined}
        onClick={handleClick}
        pressed={node.selected}
        text={node.title}
        tone={node.tone}
      />
    </TooltipOfDisabled>
  )
}
