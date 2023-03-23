import React, {useState, useRef, useMemo, useEffect, useCallback, startTransition} from 'react'
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
  boundaryElement?: HTMLElement
  isEditing: boolean
  onDelete: () => void
  onEdit: () => void
  referenceElement?: HTMLElement
  title: string
}

export function AnnotationToolbarPopover(props: AnnotationToolbarPopoverProps) {
  const {boundaryElement, isEditing, onDelete, onEdit, referenceElement, title} = props
  const [popoverOpen, setPopoverOpen] = useState<boolean>(false)
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

  // Close floating toolbar on Escape
  useGlobalKeyDown(
    useCallback(
      (event) => {
        if (!popoverOpen) {
          return
        }
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          setPopoverOpen(false)
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
      [popoverOpen]
    )
  )

  const handleSelectionChange = useCallback(() => {
    const winSelection = window.getSelection()
    if (!winSelection) {
      return
    }
    const {anchorNode, anchorOffset, focusNode, focusOffset} = winSelection
    startTransition(() =>
      setSelection({
        anchorNode,
        anchorOffset,
        focusNode,
        focusOffset,
      })
    )
  }, [])

  // Detect selection changes
  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange, {passive: true})
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [handleSelectionChange])

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
    if (referenceElement?.contains(anchorNode) && anchorNode === focusNode) {
      const range = window.getSelection()?.getRangeAt(0)
      const rect = range?.getBoundingClientRect()

      rangeRef.current = range || null

      if (rect) {
        startTransition(() => setCursorRect(rect))
      }
      startTransition(() => setPopoverOpen(true))
    } else {
      startTransition(() => {
        setPopoverOpen(false)
        setCursorRect(null)
      })
      rangeRef.current = null
    }
  }, [isEditing, selection, referenceElement])

  useEffect(() => {
    if (isEditing) {
      setPopoverOpen(false)
      isTabbing.current = false
    }
  }, [isEditing, referenceElement, selection])

  const handleEditButtonClicked = useCallback(() => {
    setPopoverOpen(false)
    onEdit()
  }, [onEdit])

  const handleRemoveButtonClicked = useCallback(() => {
    setPopoverOpen(false)
    onDelete()
  }, [onDelete])

  useEffect(() => {
    if (!popoverOpen) {
      return undefined
    }

    const handleScroll = () => {
      if (rangeRef.current) {
        setCursorRect(rangeRef.current.getBoundingClientRect())
      }
    }

    boundaryElement?.addEventListener('scroll', handleScroll, {passive: true})

    return () => {
      boundaryElement?.removeEventListener('scroll', handleScroll)
    }
  }, [popoverOpen, boundaryElement])

  if (!popoverOpen) {
    return null
  }

  return (
    <ToolbarPopover
      boundaryElement={boundaryElement}
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
              ref={editButtonRef}
              icon={EditIcon}
              mode="bleed"
              onClick={handleEditButtonClicked}
              padding={2}
              alt="Edit annotation"
            />
            <Button
              icon={TrashIcon}
              mode="bleed"
              padding={2}
              onClick={handleRemoveButtonClicked}
              tone="critical"
              alt="Remove annotation"
            />
          </Inline>
        </Box>
      }
      fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
      open={popoverOpen}
      placement="top"
      portal="editor"
      referenceElement={cursorElement}
      scheme={popoverScheme}
    />
  )
}
