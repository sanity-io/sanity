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
  floatingBoundary: HTMLElement | null
  onOpen: () => void
  onRemove: () => void
  referenceBoundary: HTMLElement | null
  referenceElement: HTMLElement | null
  title: string
}

export function AnnotationToolbarPopover(props: AnnotationToolbarPopoverProps) {
  const {floatingBoundary, onOpen, onRemove, referenceBoundary, referenceElement, title} = props
  const [popoverOpen, setPopoverOpen] = useState<boolean>(false)
  const [cursorRect, setCursorRect] = useState<DOMRect | null>(null)
  const [selection, setSelection] = useState<{
    anchorNode: Node | null
    anchorOffset: number
    focusNode: Node | null
    focusOffset: number
  } | null>(null)
  const rangeRef = useRef<Range | null>(null)
  const {sanity} = useTheme()
  const popoverRef = useRef<HTMLDivElement | null>(null)
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
          setPopoverOpen(false)
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
    const {anchorNode, focusNode} = selection
    if (referenceElement?.contains(anchorNode) && anchorNode === focusNode) {
      const range = window.getSelection()?.getRangeAt(0)
      const rect = range?.getBoundingClientRect()

      rangeRef.current = range || null

      if (rect) {
        startTransition(() => setCursorRect(rect))
      }
      startTransition(() => setPopoverOpen(true))
    } else if (focusNode) {
      startTransition(() => {
        setPopoverOpen(false)
        setCursorRect(null)
      })
      rangeRef.current = null
    }
  }, [selection, referenceElement])

  const handleEditButtonClicked = useCallback(() => {
    setPopoverOpen(false)
    onOpen()
  }, [onOpen])

  const handleRemoveButtonClicked = useCallback(() => {
    setPopoverOpen(false)
    onRemove()
  }, [onRemove])

  useEffect(() => {
    if (!popoverOpen) {
      return undefined
    }

    const handleScroll = () => {
      if (rangeRef.current) {
        setCursorRect(rangeRef.current.getBoundingClientRect())
      }
    }

    floatingBoundary?.addEventListener('scroll', handleScroll, {passive: true})

    return () => {
      floatingBoundary?.removeEventListener('scroll', handleScroll)
    }
  }, [popoverOpen, floatingBoundary])

  if (!popoverOpen) {
    return null
  }

  return (
    <ToolbarPopover
      floatingBoundary={floatingBoundary}
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
              onClick={handleEditButtonClicked}
              padding={2}
              alt="Edit annotation"
              tabIndex={0}
            />
            <Button
              icon={TrashIcon}
              mode="bleed"
              padding={2}
              onClick={handleRemoveButtonClicked}
              tone="critical"
              alt="Remove annotation"
              tabIndex={0}
            />
          </Inline>
        </Box>
      }
      fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
      open
      placement="top"
      portal
      preventOverflow
      ref={popoverRef}
      referenceBoundary={referenceBoundary}
      referenceElement={cursorElement}
      scheme={popoverScheme}
    />
  )
}
