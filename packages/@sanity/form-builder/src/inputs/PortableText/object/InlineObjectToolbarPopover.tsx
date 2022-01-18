import React, {useRef, useCallback, useEffect} from 'react'
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
  onDelete: (event: React.MouseEvent<HTMLButtonElement>) => void
  onEdit: (event: React.MouseEvent<HTMLButtonElement>) => void
  open: boolean
  referenceElement: HTMLElement
  scrollElement: HTMLElement
  setOpen: (open: boolean) => void
  title: string
}

export function InlineObjectToolbarPopover(props: InlineObjectToolbarPopoverProps) {
  const {open, onEdit, onDelete, referenceElement, scrollElement, setOpen, title} = props
  const {sanity} = useTheme()
  const editButtonRef = useRef<HTMLButtonElement>()
  const popoverScheme = sanity.color.dark ? 'light' : 'dark'
  const isTabbing = useRef<boolean>(false)

  // Close floating toolbar on Escape
  // Focus to edit button on Tab
  useGlobalKeyDown(
    useCallback(
      (event) => {
        if (!open) {
          return
        }
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          isTabbing.current = false
          setOpen(false)
        }
        if (event.key === 'Tab') {
          if (!isTabbing.current) {
            event.preventDefault()
            event.stopPropagation()
            editButtonRef.current.focus()
            isTabbing.current = true
          }
        }
      },
      [open, setOpen]
    )
  )

  useEffect(() => {
    if (open && isTabbing.current) {
      editButtonRef.current?.focus()
    }
  }, [open])

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
              />
              <Button
                icon={TrashIcon}
                mode="bleed"
                padding={2}
                onClick={onDelete}
                tone="critical"
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
