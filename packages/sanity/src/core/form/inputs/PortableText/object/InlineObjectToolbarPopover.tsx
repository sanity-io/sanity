import React, {useRef, useCallback, useEffect, useMemo, useState} from 'react'
import {
  Box,
  Button,
  Inline,
  Popover,
  PopoverProps,
  Text,
  useGlobalKeyDown,
  useTheme,
} from '@sanity/ui'
import styled from 'styled-components'
import {EditIcon, TrashIcon} from '@sanity/icons'

const ToolbarPopover = styled(Popover)`
  &[data-popper-reference-hidden='true'] {
    display: none !important;
  }
`

const POPOVER_FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = ['top', 'bottom']

interface InlineObjectToolbarPopoverProps {
  open: boolean
  onClose: () => void
  onDelete: (event: React.MouseEvent<HTMLButtonElement>) => void
  onEdit: (event: React.MouseEvent<HTMLButtonElement>) => void
  referenceElement?: HTMLElement
  boundaryElement?: HTMLElement
  title: string
}

export function InlineObjectToolbarPopover(props: InlineObjectToolbarPopoverProps) {
  const {onClose, onEdit, onDelete, referenceElement, boundaryElement, title, open} = props
  const {sanity} = useTheme()
  const editButtonRef = useRef<HTMLButtonElement | null>(null)
  const popoverScheme = sanity.color.dark ? 'light' : 'dark'
  const isTabbing = useRef<boolean>(false)
  const [popoverOpen, setPopoverOpen] = useState(false)

  // Close floating toolbar on Escape
  // Focus to edit button on Tab
  useGlobalKeyDown(
    useCallback(
      (event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          isTabbing.current = false
          onClose()
        }
        if (event.key === 'Tab') {
          if (!isTabbing.current) {
            event.preventDefault()
            event.stopPropagation()
            editButtonRef.current?.focus()
            isTabbing.current = true
          }
        }
      },
      [onClose]
    )
  )

  useEffect(() => {
    if (isTabbing.current) {
      editButtonRef.current?.focus()
    }
  }, [])

  const popoverContent = useMemo(
    () => (
      <Box padding={1}>
        <Inline space={1}>
          <Box padding={2}>
            <Text weight="semibold" size={1}>
              {title}
            </Text>
          </Box>
          <Button
            icon={EditIcon}
            mode="bleed"
            onClick={onEdit}
            padding={2}
            ref={editButtonRef}
            alt="Edit object"
          />
          <Button
            icon={TrashIcon}
            mode="bleed"
            padding={2}
            onClick={onDelete}
            tone="critical"
            alt="Remove object"
          />
        </Inline>
      </Box>
    ),
    [onDelete, onEdit, title]
  )

  // Use own state here so that initially the popover is always closed.
  // (props.open can be true initially)
  useEffect(() => {
    setPopoverOpen(open)
  }, [open])

  return (
    <ToolbarPopover
      boundaryElement={boundaryElement}
      constrainSize
      content={popoverContent}
      fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
      open={popoverOpen}
      placement="top"
      portal="editor"
      referenceElement={referenceElement}
      scheme={popoverScheme}
    />
  )
}
