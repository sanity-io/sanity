import {useId} from '@reach/auto-id'
import {
  Tooltip,
  Box,
  Button,
  Menu,
  MenuItem,
  Popover,
  Hotkeys,
  Inline,
  Text,
  Flex,
  Theme,
  useClickOutside,
} from '@sanity/ui'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import styled from 'styled-components'
import {ChevronDownIcon} from '@sanity/icons'
import {ActionStateDialog} from './actionStateDialog'

interface Props {
  actionStates: any[]
  onOpen: () => void
  onClose: () => void
  isOpen: boolean
  disabled: boolean
}

export function ActionMenu({actionStates, onOpen, onClose, disabled, isOpen}: Props) {
  const idPrefix = useId()
  const listRef = useRef<HTMLUListElement>(null)
  const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (listRef.current) {
      const el: HTMLUListElement | null = listRef.current

      if (el) {
        el.focus()
      }
    }
  }, [isOpen])

  const handleCloseMenu = useCallback(() => {
    if (!isOpen) {
      return
    }

    // this is a bit hacky, but if there is a modal open, we should not close on outside clicks
    const hasOpenDialog = actionStates.some((state) => state.dialog)

    if (!hasOpenDialog) {
      onClose()
    }
  }, [actionStates, isOpen, onClose])

  useClickOutside(handleCloseMenu, [popoverElement])

  return (
    <Box marginLeft={2}>
      <Popover
        id={`${idPrefix}-menu`}
        open={isOpen}
        placement="top-end"
        ref={setPopoverElement}
        content={
          <Menu paddingY={1} focusLast>
            {actionStates.map((actionState, idx) => (
              <ActionMenuListItem
                actionState={actionState}
                disabled={disabled}
                // eslint-disable-next-line react/no-array-index-key
                key={idx}
              />
            ))}
          </Menu>
        }
      >
        <Button
          icon={ChevronDownIcon}
          aria-controls={`${idPrefix}-menu`}
          aria-haspopup="true"
          aria-label="Actions"
          disabled={disabled}
          id={`${idPrefix}-button`}
          onClick={isOpen ? onClose : onOpen}
          mode="ghost"
        />
      </Popover>
    </Box>
  )
}

// Note: Should this be necessary?
// Should @sanity/ui instead expose a mode (bleed, ghost) etc. on the menu items
// to get the same result? Could potentially use a
// button inside the MenuItem but then the wrong item gets focus when using keyboards

const StyledMenuItem = styled(MenuItem)`
  ${({theme}: {theme: Theme}) => `

   &:not([hidden]) {
     --card-bg-color: ${theme.sanity.color.card.enabled.bg};
     --card-fg-color: ${theme.sanity.color.card.enabled.fg};
     --card-muted-fg-color: ${theme.sanity.color.card.enabled.fg};
   }

   &[data-as='button']:not(:disabled):focus  {
     --card-bg-color: ${theme.sanity.color.muted.default.hovered.bg};
     --card-fg-color: ${theme.sanity.color.muted.default.hovered.fg};
     --card-muted-fg-color: ${theme.sanity.color.muted.default.hovered.fg};
     --card-hairline-hard-color: ${theme.sanity.color.muted.default.enabled.fg};
     --card-code-fg-color: ${theme.sanity.color.muted.default.enabled.fg};
   }
 `}
`

function ActionMenuListItem({actionState, disabled}) {
  const [buttonElement, setButtonElement] = useState<HTMLElement | null>(null)
  return (
    <StyledMenuItem
      disabled={disabled || Boolean(actionState.disabled)}
      onClick={actionState.onHandle}
      ref={setButtonElement}
      paddingY={3}
    >
      <Tooltip
        disabled={!actionState.title}
        content={
          <Box padding={2} style={{maxWidth: 260}}>
            <Text size={1} muted>
              {actionState.title}
            </Text>
          </Box>
        }
        portal
        placement="left"
      >
        <Flex align="center" justify="flex-start">
          <Inline space={3}>
            {actionState.icon && <Text>{React.createElement(actionState.icon)}</Text>}
            <Text>{actionState.label}</Text>
            {actionState.shortcut && <Hotkeys keys={String(actionState.shortcut).split('+')} />}
          </Inline>
        </Flex>
      </Tooltip>

      {actionState.dialog && (
        <ActionStateDialog dialog={actionState.dialog} referenceElement={buttonElement} />
      )}
    </StyledMenuItem>
  )
}
