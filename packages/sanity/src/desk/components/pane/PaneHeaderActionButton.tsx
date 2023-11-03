import React, {MouseEvent, useCallback, useId} from 'react'
import {Menu, MenuButton, Text} from '@sanity/ui'
import {UnknownIcon} from '@sanity/icons'
import {Intent} from '../../structureBuilder'
import {_PaneMenuGroup, _PaneMenuItem} from './types'
import {PaneMenuButtonItem} from './PaneMenuButtonItem'
import {TooltipOfDisabled, StatusButton} from 'sanity'
import {useIntentLink} from 'sanity/router'

export interface PaneHeaderActionButtonProps {
  node: _PaneMenuItem | _PaneMenuGroup
}

export function PaneHeaderActionButton(props: PaneHeaderActionButtonProps) {
  const {node} = props

  if (node.type === 'item') {
    return <PaneHeaderMenuItemActionButton node={node} />
  }

  if (node.type === 'group') {
    return <PaneHeaderMenuGroupActionButton node={node} />
  }

  console.warn('unknown menu node (expected `type: "item" | "group"`):', node)

  return null
}

export interface PaneHeaderMenuItemActionButtonProps {
  node: _PaneMenuItem
}

export function PaneHeaderMenuItemActionButton(props: PaneHeaderMenuItemActionButtonProps) {
  const {node} = props

  if (node.intent) {
    return <PaneHeaderActionIntentButton {...props} intent={node.intent} />
  }

  const disabledTooltipContent = typeof node.disabled === 'object' && (
    <Text size={1}>{node.disabled.reason}</Text>
  )

  return (
    <TooltipOfDisabled content={disabledTooltipContent} placement="bottom">
      <StatusButton
        disabled={Boolean(node.disabled)}
        hotkey={node.hotkey?.split('+')}
        icon={node.icon}
        label={disabledTooltipContent ? undefined : node.title}
        // eslint-disable-next-line react/jsx-handler-names
        onClick={node.onAction}
        selected={node.selected}
        tone={node.tone}
      />
    </TooltipOfDisabled>
  )
}

function PaneHeaderActionIntentButton(props: {intent: Intent; node: _PaneMenuItem}) {
  const {intent, node} = props
  const disabledTooltipContent = typeof node.disabled === 'object' && (
    <Text size={1}>{node.disabled.reason}</Text>
  )
  const intentLink = useIntentLink({intent: intent.type, params: intent.params})

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      intentLink.onClick(event)
      node.onAction()
    },
    [intentLink, node],
  )

  return (
    <TooltipOfDisabled content={disabledTooltipContent} placement="bottom">
      <StatusButton
        as="a"
        disabled={Boolean(node.disabled)}
        hotkey={node.hotkey?.split('+')}
        href={intentLink.href}
        icon={node.icon}
        label={disabledTooltipContent ? undefined : node.title}
        onClick={handleClick}
        selected={node.selected}
        tone={node.tone}
      />
    </TooltipOfDisabled>
  )
}

export interface PaneHeaderMenuGroupActionButtonProps {
  node: _PaneMenuGroup
}

function PaneHeaderMenuGroupActionButton(props: PaneHeaderMenuGroupActionButtonProps) {
  const {node} = props

  return (
    <MenuButton
      button={
        <StatusButton disabled={node.disabled} icon={node.icon ?? UnknownIcon} label={node.title} />
      }
      id={useId()}
      menu={
        <Menu>
          {node.children.map((child, idx) => {
            return (
              <PaneMenuButtonItem
                disabled={Boolean(node.disabled)}
                isAfterGroup={node.children[idx - 1]?.type === 'group'}
                key={child.key}
                node={child}
              />
            )
          })}
        </Menu>
      }
    />
  )
}
