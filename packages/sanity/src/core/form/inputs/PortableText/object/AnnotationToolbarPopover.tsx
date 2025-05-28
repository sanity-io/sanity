import {PortableTextEditor, usePortableTextEditor} from '@portabletext/editor'
import {EditIcon, TrashIcon} from '@sanity/icons'
import {Box, Flex, Text, useGlobalKeyDown, useTheme} from '@sanity/ui'
import {type ReactNode, useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {Button, Popover, type PopoverProps} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'

const POPOVER_FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = ['top', 'bottom']

interface AnnotationToolbarPopoverProps {
  annotationOpen: boolean
  annotationTextSelected: boolean
  floatingBoundary: HTMLElement | null
  onOpenAnnotation: () => void
  onRemoveAnnotation: () => void
  referenceBoundary: HTMLElement | null
  referenceElement: HTMLElement | null
  title: string
}

export function AnnotationToolbarPopover(props: AnnotationToolbarPopoverProps): ReactNode {
  const {
    annotationOpen,
    annotationTextSelected,
    floatingBoundary,
    onOpenAnnotation,
    onRemoveAnnotation,
    referenceBoundary,
    referenceElement,
    title,
  } = props
  const [popoverOpen, setPopoverOpen] = useState<boolean>(false)
  const [cursorRect, setCursorRect] = useState<DOMRect | null>(null)
  const rangeRef = useRef<Range | null>(null)
  const {sanity} = useTheme()
  const {t} = useTranslation()
  const editButtonRef = useRef<HTMLButtonElement | null>(null)
  const deleteButtonRef = useRef<HTMLButtonElement | null>(null)
  const focusTrappedRef = useRef<HTMLButtonElement | null>(null)
  const popoverScheme = sanity.color.dark ? 'light' : 'dark'
  const editor = usePortableTextEditor()

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

  const handleClosePopover = useCallback(() => {
    PortableTextEditor.focus(editor)
    setPopoverOpen(false)
    focusTrappedRef.current = null
  }, [editor])

  // Tab to edit button on tab
  // Close floating toolbar on Escape
  useGlobalKeyDown(
    useCallback(
      (event) => {
        if (!popoverOpen) {
          return
        }
        if (event.key === 'Tab') {
          if (
            annotationTextSelected &&
            event.target instanceof HTMLElement &&
            event.target.contentEditable &&
            focusTrappedRef.current === null
          ) {
            event.preventDefault()
            editButtonRef.current?.focus()
            focusTrappedRef.current = editButtonRef.current
            return
          }
          if (event.target === deleteButtonRef.current) {
            event.preventDefault()
            event.stopPropagation()
            focusTrappedRef.current = null
            PortableTextEditor.focus(editor)
            return
          }
        }
        if (event.key === 'Escape') {
          handleClosePopover()
        }
      },
      [editor, handleClosePopover, popoverOpen, annotationTextSelected],
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

    focusTrappedRef.current = null
    const range = sel.getRangeAt(0)
    const isWithinRoot = referenceElement?.contains(range.commonAncestorContainer)

    if (!isWithinRoot) {
      setPopoverOpen(false)
      setCursorRect(null)
      return
    }
    const rect = range?.getBoundingClientRect()
    if (rect) {
      setCursorRect(rect)
      setPopoverOpen(true)
    }
  }, [annotationOpen, referenceElement, setPopoverOpen])

  // Detect selection changes
  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange, {passive: true})
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [handleSelectionChange])

  const handleEditButtonClicked = useCallback(() => {
    setPopoverOpen(false)
    onOpenAnnotation()
  }, [onOpenAnnotation])

  const handleRemoveButtonClicked = useCallback(() => {
    setPopoverOpen(false)
    onRemoveAnnotation()
  }, [onRemoveAnnotation])

  const handleScroll = useCallback(() => {
    if (rangeRef.current) {
      setCursorRect(rangeRef.current.getBoundingClientRect())
    }
  }, [])

  useEffect(() => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      rangeRef.current = sel.getRangeAt(0)
    }
  }, [popoverOpen])

  useEffect(() => {
    // Listen for scroll events on the floating boundary and the reference boundary
    // and move the popover accordingly
    if (popoverOpen) {
      floatingBoundary?.addEventListener('scroll', handleScroll)
      referenceBoundary?.addEventListener('scroll', handleScroll)
    }
    return () => {
      floatingBoundary?.removeEventListener('scroll', handleScroll)
      referenceBoundary?.removeEventListener('scroll', handleScroll)
    }
  }, [popoverOpen, referenceBoundary, floatingBoundary, handleScroll])

  return (
    <Popover
      open={popoverOpen}
      floatingBoundary={floatingBoundary}
      constrainSize
      content={
        <Box padding={1} data-testid="annotation-toolbar-popover">
          <Flex gap={1}>
            <Box padding={2}>
              <Text weight="medium" size={1}>
                {title}
              </Text>
            </Box>
            <Button
              aria-label={t('inputs.portable-text.action.edit-annotation-aria-label')}
              data-testid="edit-annotation-button"
              icon={EditIcon}
              mode="bleed"
              onClick={handleEditButtonClicked}
              ref={editButtonRef}
              tabIndex={0}
              tooltipProps={null}
            />
            <Button
              aria-label={t('inputs.portable-text.action.remove-annotation-aria-label')}
              data-testid="remove-annotation-button"
              icon={TrashIcon}
              mode="bleed"
              onClick={handleRemoveButtonClicked}
              ref={deleteButtonRef}
              tabIndex={0}
              tone="critical"
              tooltipProps={null}
            />
          </Flex>
        </Box>
      }
      fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
      placement="top"
      portal
      preventOverflow
      referenceBoundary={referenceBoundary}
      referenceElement={cursorElement}
      scheme={popoverScheme}
    />
  )
}
