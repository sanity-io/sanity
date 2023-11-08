import {ChevronDownIcon} from '@sanity/icons'
import {
  Menu,
  MenuButton,
  PopoverProps,
  Tooltip, // eslint-disable-line no-restricted-imports
} from '@sanity/ui'
import React, {useCallback, useRef, useState, useMemo, useId} from 'react'
import {Button, MenuItem} from '../../../../ui'
import {ActionStateDialog} from './ActionStateDialog'
import {DocumentActionDescription, LegacyLayerProvider} from 'sanity'

export interface ActionMenuButtonProps {
  actionStates: DocumentActionDescription[]
  disabled: boolean
}

export function ActionMenuButton(props: ActionMenuButtonProps) {
  const {actionStates, disabled} = props
  const idPrefix = useId()
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const [actionIndex, setActionIndex] = useState(-1)
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null)

  const handleAction = useCallback((idx: number) => {
    setActionIndex(idx)
  }, [])

  const popoverProps: PopoverProps = useMemo(
    () => ({
      placement: 'top-end',
      portal: true,
      preventOverflow: true,
    }),
    [],
  )

  const currentAction = actionStates[actionIndex]

  return (
    <>
      <MenuButton
        id={`${idPrefix}-action-menu`}
        button={
          <Button
            data-testid="action-menu-button"
            aria-label="Open document actions"
            disabled={disabled}
            icon={ChevronDownIcon}
            mode="bleed"
            ref={buttonRef}
          />
        }
        menu={
          <Menu padding={1}>
            {actionStates.map((actionState, idx) => (
              <ActionMenuListItem
                actionState={actionState}
                disabled={disabled}
                index={idx}
                // eslint-disable-next-line react/no-array-index-key
                key={idx}
                onAction={handleAction}
              />
            ))}
          </Menu>
        }
        popover={popoverProps}
        ref={setReferenceElement}
      />

      {currentAction && currentAction.dialog && (
        <LegacyLayerProvider zOffset="paneFooter">
          <ActionStateDialog dialog={currentAction.dialog} referenceElement={referenceElement} />
        </LegacyLayerProvider>
      )}
    </>
  )
}

interface ActionMenuListItemProps {
  actionState: DocumentActionDescription
  disabled: boolean
  index: number
  onAction: (idx: number) => void
}

function ActionMenuListItem(props: ActionMenuListItemProps) {
  const {actionState, disabled, index, onAction} = props
  const {onHandle} = actionState

  const handleClick = useCallback(() => {
    onAction(index)
    if (onHandle) onHandle()
  }, [index, onAction, onHandle])

  const menuItemContent = useCallback(
    (item: React.JSX.Element) => {
      return (
        <Tooltip content={actionState.title} disabled={!actionState.title} placement="top" portal>
          {item}
        </Tooltip>
      )
    },
    [actionState.title],
  )
  return (
    <MenuItem
      data-testid={`action-${actionState.label.replace(' ', '')}`}
      disabled={disabled || Boolean(actionState.disabled)}
      onClick={handleClick}
      tone={actionState.tone}
      icon={actionState.icon}
      text={actionState.label}
      hotkeys={
        actionState.shortcut
          ? String(actionState.shortcut)
              .split('+')
              .map((s) => s.slice(0, 1).toUpperCase() + s.slice(1))
          : undefined
      }
      renderMenuItem={menuItemContent}
    />
  )
}
