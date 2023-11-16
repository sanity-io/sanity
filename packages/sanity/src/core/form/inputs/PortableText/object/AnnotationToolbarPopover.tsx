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
import {useTranslation} from '../../../../i18n'

const ToolbarPopover = styled(Popover)`
  &[data-popper-reference-hidden='true'] {
    display: none !important;
  }
`

const POPOVER_FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = ['top', 'bottom']

interface AnnotationToolbarPopoverProps {
  annotationOpen: boolean
  floatingBoundary: HTMLElement | null
  onOpen: () => void
  onRemove: () => void
  referenceBoundary: HTMLElement | null
  referenceElement: HTMLElement | null
  selected: boolean
  title: string
}

export function AnnotationToolbarPopover(props: AnnotationToolbarPopoverProps) {
  const {
    annotationOpen,
    floatingBoundary,
    onOpen,
    onRemove,
    referenceBoundary,
    referenceElement,
    selected,
    title,
  } = props
  const [popoverOpen, setPopoverOpen] = useState<boolean>(false)
  const [cursorRect, setCursorRect] = useState<DOMRect | null>(null)
  const rangeRef = useRef<Range | null>(null)
  const {sanity} = useTheme()
  const {t} = useTranslation()
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
      [popoverOpen],
    ),
  )

  // Open popover when selection is within the annotation text
  const handleSelectionChange = useCallback(() => {
    if (annotationOpen) {
      setPopoverOpen(false)
      setCursorRect(null)
      return
    }

    const sel = window.getSelection()

    if (!sel || sel.rangeCount === 0) return

    const range = sel.getRangeAt(0)
    const isWithinRoot = referenceElement?.contains(range.commonAncestorContainer)

    if (!isWithinRoot) {
      setPopoverOpen(false)
      setCursorRect(null)
      return
    }
    const rect = range?.getBoundingClientRect()
    if (rect) {
      setPopoverOpen(true)
      setCursorRect(rect)
    }
  }, [annotationOpen, referenceElement])

  // Detect selection changes
  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange, {passive: true})
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [handleSelectionChange])

  const handleEditButtonClicked = useCallback(() => {
    setPopoverOpen(false)
    onOpen()
  }, [onOpen])

  // Open the popover when closing the annotation dialog
  useEffect(() => {
    if (!annotationOpen && selected) {
      setPopoverOpen(true)
    }
    if (annotationOpen) {
      setPopoverOpen(false)
    }
  }, [annotationOpen, selected])

  const handleRemoveButtonClicked = useCallback(() => {
    setPopoverOpen(false)
    onRemove()
  }, [onRemove])

  const handleScroll = useCallback(() => {
    if (rangeRef.current) {
      setCursorRect(rangeRef.current.getBoundingClientRect())
    }
  }, [])

  useEffect(() => {
    if (!popoverOpen) {
      return undefined
    }

    referenceBoundary?.addEventListener('scroll', handleScroll)

    return () => {
      referenceBoundary?.removeEventListener('scroll', handleScroll)
    }
  }, [popoverOpen, referenceBoundary, handleScroll])

  if (!popoverOpen) {
    return null
  }

  return (
    <ToolbarPopover
      open={popoverOpen}
      floatingBoundary={floatingBoundary}
      constrainSize
      content={
        <Box padding={1} data-testid="annotation-toolbar-popover">
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
              alt={t('inputs.portable-text.action.edit-annotation')}
              tabIndex={0}
            />
            <Button
              icon={TrashIcon}
              mode="bleed"
              padding={2}
              onClick={handleRemoveButtonClicked}
              tone="critical"
              alt={t('inputs.portable-text.action.remove-annotation')}
              tabIndex={0}
            />
          </Inline>
        </Box>
      }
      fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
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
