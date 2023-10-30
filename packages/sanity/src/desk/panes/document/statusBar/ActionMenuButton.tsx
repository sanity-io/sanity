import {ChevronDownIcon} from '@sanity/icons'
import {
  Box,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  PopoverProps,
  Text,
} from '@sanity/ui'
import React, {
  createElement,
  isValidElement,
  useCallback,
  useRef,
  useState,
  useMemo,
  useId,
} from 'react'
import {isValidElementType} from 'react-is'
import {Tooltip} from '../../../../ui'
import {ActionStateDialog} from './ActionStateDialog'
import {DocumentActionDescription, Hotkeys, LegacyLayerProvider} from 'sanity'

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
            mode="ghost"
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

  return (
    <MenuItem
      data-testid={`action-${actionState.label.replace(' ', '')}`}
      disabled={disabled || Boolean(actionState.disabled)}
      onClick={handleClick}
      padding={0}
      tone={actionState.tone}
    >
      <Tooltip
        content={actionState.title}
        disabled={!actionState.title}
        fallbackPlacements={['left', 'bottom']}
        placement="top"
        portal
      >
        <Flex align="center" paddingX={3}>
          <Flex flex={1} paddingY={3}>
            {actionState.icon && (
              <Box marginRight={3}>
                <Text>
                  {isValidElement(actionState.icon) && actionState.icon}
                  {isValidElementType(actionState.icon) && createElement(actionState.icon)}
                </Text>
              </Box>
            )}

            <Text>{actionState.label}</Text>
          </Flex>

          {actionState.shortcut && (
            <Box marginLeft={3}>
              <Hotkeys
                keys={String(actionState.shortcut)
                  .split('+')
                  .map((s) => s.slice(0, 1).toUpperCase() + s.slice(1))}
              />
            </Box>
          )}
        </Flex>
      </Tooltip>
    </MenuItem>
  )
}
