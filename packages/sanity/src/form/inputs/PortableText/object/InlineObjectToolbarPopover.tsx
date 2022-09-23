import React, {useRef, useCallback, useEffect, useState} from 'react'
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
  referenceElement: HTMLElement | null
  scrollElement: HTMLElement | null
  title: string
}

export function InlineObjectToolbarPopover(props: InlineObjectToolbarPopoverProps) {
  const {onClose, onEdit, onDelete, referenceElement, scrollElement, title, open} = props
  const {sanity} = useTheme()
  const editButtonRef = useRef<HTMLButtonElement | null>(null)
  const popoverScheme = sanity.color.dark ? 'light' : 'dark'
  const isTabbing = useRef<boolean>(false)

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

  return (
    <div contentEditable={false}>
      <ToolbarPopover
        boundaryElement={scrollElement}
        constrainSize
        content={
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
        }
        fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
        open={open}
        placement="top"
        portal="editor"
        referenceElement={referenceElement}
        scheme={popoverScheme}
      />
    </div>
  )
}
