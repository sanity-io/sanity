import {UnknownIcon} from '@sanity/icons'
import {Menu} from '@sanity/ui'
import {type MouseEvent, useCallback, useId} from 'react'
import {StatusButton, useI18nText, useTranslation} from 'sanity'
import {useIntentLink} from 'sanity/router'

import {Button, MenuButton} from '../../../ui-components'
import {type Intent} from '../../structureBuilder'
import {PaneMenuButtonItem} from './PaneMenuButtonItem'
import {type _PaneMenuGroup, type _PaneMenuItem} from './types'

function getDisabledReason(node: _PaneMenuItem) {
  if (!node.disabled) {
    return {disabledReason: undefined, ariaLabel: undefined, isDisabled: false}
  }

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
  const {t} = useTranslation()

  if (node.intent) {
    return <PaneHeaderActionIntentButton {...props} intent={node.intent} />
  }

  const {disabledReason, ariaLabel, isDisabled} = getDisabledReason(node)

  return (
    <StatusButton
      disabled={isDisabled}
      icon={node.icon}
      // eslint-disable-next-line react/jsx-handler-names
      onClick={node.onAction}
      selected={node.selected}
      tone={node.tone}
      aria-label={ariaLabel || title || t('status-button.aria-label')}
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
  const {t} = useTranslation()

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
      forwardedAs="a"
      disabled={isDisabled}
      href={intentLink.href}
      icon={node.icon}
      onClick={handleClick}
      selected={node.selected}
      tone={node.tone}
      aria-label={ariaLabel || node.title || t('status-button.aria-label')}
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
          mode="bleed"
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
