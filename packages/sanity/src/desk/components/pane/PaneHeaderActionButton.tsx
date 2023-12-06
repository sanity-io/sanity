import React, {MouseEvent, useCallback, useId} from 'react'
import {ButtonProps, Menu, MenuButton, Text} from '@sanity/ui'
import {UnknownIcon} from '@sanity/icons'
import {Intent} from '../../structureBuilder'
import {_PaneMenuGroup, _PaneMenuItem} from './types'
import {PaneMenuButtonItem} from './PaneMenuButtonItem'
import {TooltipOfDisabled, StatusButton, useTranslation} from 'sanity'
import {useIntentLink} from 'sanity/router'

export interface PaneHeaderActionButtonProps {
  node: _PaneMenuItem | _PaneMenuGroup
  padding?: ButtonProps['padding']
}

export function PaneHeaderActionButton(props: PaneHeaderActionButtonProps) {
  const {node, padding} = props

  if (node.type === 'item') {
    return <PaneHeaderMenuItemActionButton node={node} padding={padding} />
  }

  if (node.type === 'group') {
    return <PaneHeaderMenuGroupActionButton node={node} padding={padding} />
  }

  console.warn('unknown menu node (expected `type: "item" | "group"`):', node)

  return null
}

export interface PaneHeaderMenuItemActionButtonProps {
  node: _PaneMenuItem
  padding?: ButtonProps['padding']
}

export function PaneHeaderMenuItemActionButton(props: PaneHeaderMenuItemActionButtonProps) {
  const {node, padding} = props
  const {t} = useTranslation(node.i18n?.ns)

  if (node.intent) {
    return <PaneHeaderActionIntentButton {...props} intent={node.intent} />
  }

  const disabledTooltipContent = typeof node.disabled === 'object' && (
    <Text size={1}>{node.disabled.reason}</Text>
  )

  const title = node.i18n
    ? t(node.i18n.key, {
        ns: node.i18n.ns,
        defaultValue: node.title, // fallback
      })
    : node.title

  return (
    <TooltipOfDisabled content={disabledTooltipContent} placement="bottom">
      <StatusButton
        disabled={Boolean(node.disabled)}
        hotkey={node.hotkey?.split('+')}
        icon={node.icon}
        label={disabledTooltipContent ? undefined : title}
        // eslint-disable-next-line react/jsx-handler-names
        onClick={node.onAction}
        padding={padding}
        selected={node.selected}
        tone={node.tone}
      />
    </TooltipOfDisabled>
  )
}

function PaneHeaderActionIntentButton(props: {
  intent: Intent
  node: _PaneMenuItem
  padding?: ButtonProps['padding']
}) {
  const {intent, node, padding} = props
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
        padding={padding}
        selected={node.selected}
        tone={node.tone}
      />
    </TooltipOfDisabled>
  )
}

export interface PaneHeaderMenuGroupActionButtonProps {
  node: _PaneMenuGroup
  padding?: ButtonProps['padding']
}

function PaneHeaderMenuGroupActionButton(props: PaneHeaderMenuGroupActionButtonProps) {
  const {node, padding} = props
  const {t} = useTranslation(node.i18n?.ns)

  const title = node.i18n
    ? t(node.i18n.key, {
        ns: node.i18n.ns,
        defaultValue: node.title, // fallback
      })
    : node.title

  return (
    <MenuButton
      button={
        <StatusButton
          disabled={node.disabled}
          icon={node.icon ?? UnknownIcon}
          label={title}
          padding={padding}
        />
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
