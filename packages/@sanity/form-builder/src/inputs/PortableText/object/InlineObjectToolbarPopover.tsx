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
import {PortableTextEditor, usePortableTextEditor} from '@sanity/portable-text-editor'

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

export function EditObjectToolTip(props: InlineObjectToolbarPopoverProps) {
  const {open, onEdit, onDelete, referenceElement, scrollElement, setOpen, title} = props
  const {sanity} = useTheme()
  const editor = usePortableTextEditor()
  const editButtonRef = useRef<HTMLButtonElement>()
  const popoverScheme = sanity.color.dark ? 'light' : 'dark'
  const isTabbing = useRef<boolean>(false)

  // Close floating toolbar on Escape
  useGlobalKeyDown(
    useCallback(
      (event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault()
          event.stopPropagation()
          isTabbing.current = false
          setOpen(false)
          PortableTextEditor.focus(editor)
        }
        if (event.key === 'Tab' && open) {
          if (!isTabbing.current) {
            event.preventDefault()
            event.stopPropagation()
            editButtonRef.current.focus()
            isTabbing.current = true
          }
        }
      },
      [editor, open, setOpen]
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
