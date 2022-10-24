import React, {useState, useRef, useMemo, useEffect, useCallback} from 'react'
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

interface AnnotationToolbarPopoverProps {
  /**
   * Needed to update the popover position on scroll
   */
  scrollElement?: HTMLElement
  annotationElement?: HTMLElement
  textElement?: HTMLElement
  onEdit: (event: React.MouseEvent<HTMLButtonElement>) => void
  onDelete: (event: React.MouseEvent<HTMLButtonElement>) => void
  title: string
}

export function AnnotationToolbarPopover(props: AnnotationToolbarPopoverProps) {
  const {scrollElement, annotationElement, textElement, title, onEdit, onDelete} = props
  const [open, setOpen] = useState<boolean>(false)
  const [cursorRect, setCursorRect] = useState<DOMRect | null>(null)
  const [selection, setSelection] = useState<{
    anchorNode: Node | null
    anchorOffset: number
    focusNode: Node | null
    focusOffset: number
  } | null>(null)
  const isClosingRef = useRef<boolean>(false)
  const rangeRef = useRef<Range | null>(null)
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const isTabbing = useRef<boolean>(false)
  const {sanity} = useTheme()

  const popoverScheme = sanity.color.dark ? 'light' : 'dark'

  // This is a "virtual element" (supported by Popper.js)
  const cursorElement = useMemo(() => {
    if (!cursorRect) {
      return null
    }

    return {
      getBoundingClientRect: () => {
        return cursorRect
      },
    }
  }, [cursorRect]) as HTMLElement

  useEffect(() => {
    if (!open || !scrollElement) {
      return undefined
    }

    const handleScroll = () => {
      if (rangeRef.current) {
        setCursorRect(rangeRef.current.getBoundingClientRect())
      }
    }

    scrollElement.addEventListener('scroll', handleScroll, {passive: true})

    return () => {
      scrollElement.removeEventListener('scroll', handleScroll)
    }
  }, [open, scrollElement])

  // Close floating toolbar on Escape
  useGlobalKeyDown(
    useCallback(
      (event) => {
        if (!open) {
          return
        }
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          setOpen(false)
          isTabbing.current = false
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
      [open]
    )
  )

  // Detect selection changes
  useEffect(() => {
    function handleSelectionChange() {
      if (!textElement) return
      const winSelection = window.getSelection()
      if (!winSelection) {
        return
      }
      const {anchorNode, anchorOffset, focusNode, focusOffset} = winSelection

      setSelection({
        anchorNode,
        anchorOffset,
        focusNode,
        focusOffset,
      })
    }

    document.addEventListener('selectionchange', handleSelectionChange, {passive: true})

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [textElement])

  // Open popover when selection is within annotations
  useEffect(() => {
    if (!selection) return
    if (isClosingRef.current) return
    const {anchorNode, focusNode} = selection
    // Safari would close the popover by loosing range when button is focused.
    // If we are focused and currently tabbing to the action buttons, just return here.
    if (isTabbing.current) {
      return
    }
    if (annotationElement && annotationElement.contains(anchorNode) && anchorNode === focusNode) {
      const range = window.getSelection()?.getRangeAt(0)
      const rect = range?.getBoundingClientRect()

      rangeRef.current = range || null

      if (rect) {
        setCursorRect(rect)
      }
      setOpen(true)
    } else {
      setOpen(false)
      setCursorRect(null)
      rangeRef.current = null
    }
  }, [selection, annotationElement])

  if (!open) {
    return null
  }

  return (
    <ToolbarPopover
      content={
        <Box padding={1}>
          <Inline space={1}>
            <Box padding={2}>
              <Text weight="semibold" size={1}>
                {title}
              </Text>
            </Box>
            <Button
              ref={editButtonRef}
              icon={EditIcon}
              mode="bleed"
              onClick={onEdit}
              padding={2}
              alt="Edit annotation"
            />
            <Button
              icon={TrashIcon}
              mode="bleed"
              padding={2}
              onClick={onDelete}
              tone="critical"
              alt="Remove annotation"
            />
          </Inline>
        </Box>
      }
      fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
      open={open}
      placement="top"
      portal="default"
      referenceElement={cursorElement}
      scheme={popoverScheme}
    />
  )
}
