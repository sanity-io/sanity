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
  scrollElement: HTMLElement
  annotationElement: HTMLElement
  textElement: HTMLElement
  onEdit: (event: React.MouseEvent<HTMLButtonElement>) => void
  onDelete: (event: React.MouseEvent<HTMLButtonElement>) => void
  title: string
}

export function AnnotationToolbarPopover(props: AnnotationToolbarPopoverProps) {
  const {scrollElement, annotationElement, textElement, title, onEdit, onDelete} = props
  const [open, setOpen] = useState<boolean>(false)
  const [cursorRect, setCursorRect] = useState<DOMRect | null>(null)
  const [selection, setSelection] = useState(null)
  const isClosingRef = useRef<boolean>(false)
  const rangeRef = useRef<Range | null>(null)
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
  }, [cursorRect])

  useEffect(() => {
    if (!open) {
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
        if (event.key === 'Escape' && open) {
          setOpen(false)
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

    if (annotationElement && annotationElement.contains(anchorNode) && anchorNode === focusNode) {
      const range = window.getSelection().getRangeAt(0)
      const rect = range.getBoundingClientRect()

      rangeRef.current = range

      if (rect) {
        setCursorRect(rect)
        setOpen(true)
      }
    } else {
      setOpen(false)
      setCursorRect(null)
      rangeRef.current = null
    }
  }, [selection, annotationElement])

  return (
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
            <Button icon={EditIcon} mode="bleed" onClick={onEdit} padding={2} />
            <Button icon={TrashIcon} mode="bleed" padding={2} onClick={onDelete} tone="critical" />
          </Inline>
        </Box>
      }
      fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
      open={cursorElement && open}
      placement="top"
      portal="editor"
      referenceElement={cursorElement as HTMLElement}
      scheme={popoverScheme}
    />
  )
}
