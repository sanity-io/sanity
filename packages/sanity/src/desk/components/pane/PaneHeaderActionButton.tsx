import React, {MouseEvent, useCallback, useId} from 'react'
import {Menu} from '@sanity/ui'
import {UnknownIcon} from '@sanity/icons'
import {Intent} from '../../structureBuilder'
import {Button, MenuButton} from '../../../ui-components'
import {_PaneMenuGroup, _PaneMenuItem} from './types'
import {PaneMenuButtonItem} from './PaneMenuButtonItem'
import {StatusButton, useI18nText} from 'sanity'
import {useIntentLink} from 'sanity/router'

function getDisabledReason(node: _PaneMenuItem) {
  /**
   * This component supports receiving a `reason: string | react.ReactNode`.
   * We are casting it as string, to avoid the ts error, as content will be rendered into the tooltip which only accepts string, but it won't crash if it's a ReactNode.
   * For the aria label, we want to check if it's actually a string, to avoid generating an aria-label with the value `[object Object]`.
   */
  const disabledReason =
    typeof node.disabled === 'object' ? (node.disabled.reason as string) : undefined
  const ariaLabel =
    typeof node.disabled === 'object' && typeof node.disabled?.reason === 'string'
      ? node.disabled.reason
      : 'This is disabled'

  return {disabledReason, ariaLabel, isDisabled: Boolean(node.disabled)}
}
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
  const {title} = useI18nText(node)

  if (node.intent) {
    return <PaneHeaderActionIntentButton {...props} intent={node.intent} />
  }

  const {disabledReason, ariaLabel, isDisabled} = getDisabledReason(node)

  return (
    <StatusButton
      disabled={Boolean(node.disabled)}
      icon={node.icon}
      // eslint-disable-next-line react/jsx-handler-names
      onClick={node.onAction}
      selected={node.selected}
      tone={node.tone}
      aria-label={ariaLabel}
      tooltipProps={{
        hotkeys: !isDisabled && node.hotkey ? node.hotkey.split('+') : undefined,
        content: isDisabled ? disabledReason : title,
      }}
    />
  )
}

function PaneHeaderActionIntentButton(props: {intent: Intent; node: _PaneMenuItem}) {
  const {intent, node} = props
  const intentLink = useIntentLink({intent: intent.type, params: intent.params})

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      intentLink.onClick(event)
      node.onAction()
    },
    [intentLink, node],
  )

  const {disabledReason, ariaLabel, isDisabled} = getDisabledReason(node)

  return (
    <StatusButton
      as="a"
      disabled={isDisabled}
      href={intentLink.href}
      icon={node.icon}
      onClick={handleClick}
      selected={node.selected}
      tone={node.tone}
      aria-label={ariaLabel}
      tooltipProps={{
        hotkeys: !isDisabled && node.hotkey ? node.hotkey.split('+') : undefined,
        content: isDisabled ? disabledReason : node.title,
        placement: 'bottom',
        portal: true,
      }}
    />
  )
}

export interface PaneHeaderMenuGroupActionButtonProps {
  node: _PaneMenuGroup
}

function PaneHeaderMenuGroupActionButton(props: PaneHeaderMenuGroupActionButtonProps) {
  const {node} = props
  const {title} = useI18nText(node)

  return (
    <MenuButton
      button={
        <Button
          disabled={!!node.disabled}
          icon={node.icon ?? UnknownIcon}
          label={title}
          tooltipProps={{content: node.title, portal: true}}
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
