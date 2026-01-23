import {PortableTextEditor, usePortableTextEditor} from '@portabletext/editor'
import {EditIcon, TrashIcon} from '@sanity/icons'
import {Box, Flex, Text, useGlobalKeyDown, useTheme} from '@sanity/ui'
import {type ReactNode, useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {Button, Popover, type PopoverProps} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {useSelectedAnnotations} from '../contexts/SelectedAnnotationsContext'

const POPOVER_FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = ['top', 'bottom']

interface CombinedAnnotationPopoverProps {
  floatingBoundary: HTMLElement | null
  referenceBoundary: HTMLElement | null
}

export function CombinedAnnotationPopover(props: CombinedAnnotationPopoverProps): ReactNode {
  const {floatingBoundary, referenceBoundary} = props
  const {annotations} = useSelectedAnnotations()
  const [cursorRect, setCursorRect] = useState<DOMRect | null>(null)
  const [popoverOpen, setPopoverOpen] = useState<boolean>(false)
  const rangeRef = useRef<Range | null>(null)
  const {sanity} = useTheme()
  const {t} = useTranslation()
  const editor = usePortableTextEditor()
  const popoverScheme = sanity.color.dark ? 'light' : 'dark'
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  // Virtual element for Popper.js positioning
  const cursorElement = useMemo(() => {
    if (!cursorRect) {
      return null
    }
    return {
      getBoundingClientRect: () => cursorRect,
    }
  }, [cursorRect]) as HTMLElement | null

  // Close popover and return focus to editor
  const handleClosePopover = useCallback(() => {
    PortableTextEditor.focus(editor)
    setPopoverOpen(false)
  }, [editor])

  // Keyboard navigation
  useGlobalKeyDown(
    useCallback(
      (event) => {
        if (!popoverOpen) return

        if (event.key === 'Escape') {
          handleClosePopover()
        }
      },
      [popoverOpen, handleClosePopover],
    ),
  )

  // Track selection changes to position popover
  const handleSelectionChange = useCallback(() => {
    // Don't show popover if no annotations are selected
    if (annotations.length === 0) {
      setPopoverOpen(false)
      setCursorRect(null)
      return
    }

    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return

    const range = sel.getRangeAt(0)

    // Check if selection is within any of the registered annotation elements
    const isWithinAnnotation = annotations.some((annotation) =>
      annotation.referenceElement?.contains(range.commonAncestorContainer),
    )

    if (!isWithinAnnotation) {
      setPopoverOpen(false)
      setCursorRect(null)
      return
    }

    const rect = range.getBoundingClientRect()
    if (rect) {
      setCursorRect(rect)
      setPopoverOpen(true)
    }
  }, [annotations])

  // Listen for selection changes
  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange, {passive: true})
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [handleSelectionChange])

  // Handle scroll to keep popover positioned correctly
  const handleScroll = useCallback(() => {
    if (rangeRef.current) {
      setCursorRect(rangeRef.current.getBoundingClientRect())
    }
  }, [])

  // Store current range for scroll handling
  useEffect(() => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      rangeRef.current = sel.getRangeAt(0)
    }
  }, [popoverOpen])

  // Listen for scroll events
  useEffect(() => {
    if (popoverOpen) {
      floatingBoundary?.addEventListener('scroll', handleScroll)
      referenceBoundary?.addEventListener('scroll', handleScroll)
    }
    return () => {
      floatingBoundary?.removeEventListener('scroll', handleScroll)
      referenceBoundary?.removeEventListener('scroll', handleScroll)
    }
  }, [popoverOpen, referenceBoundary, floatingBoundary, handleScroll])

  // Don't render if no annotations or no cursor position
  if (annotations.length === 0 || !cursorElement) {
    return null
  }

  return (
    <Popover
      open={popoverOpen}
      floatingBoundary={floatingBoundary}
      constrainSize
      content={
        <Box padding={1} data-testid="annotation-toolbar-popover">
          {annotations.map((annotation, index) => (
            <Flex key={annotation.key} gap={1} align="center">
              <Box padding={2} flex={1}>
                <Text weight="medium" size={1}>
                  {annotation.title}
                </Text>
              </Box>
              <Button
                aria-label={t('inputs.portable-text.action.edit-annotation-aria-label')}
                data-testid={
                  index === 0 ? 'edit-annotation-button' : `edit-annotation-button-${index}`
                }
                icon={EditIcon}
                mode="bleed"
                onClick={() => {
                  setPopoverOpen(false)
                  annotation.onOpen()
                }}
                ref={(el) => {
                  if (el) buttonRefs.current.set(`edit-${annotation.key}`, el)
                }}
                tabIndex={0}
                tooltipProps={null}
              />
              <Button
                aria-label={t('inputs.portable-text.action.remove-annotation-aria-label')}
                data-testid={
                  index === 0 ? 'remove-annotation-button' : `remove-annotation-button-${index}`
                }
                icon={TrashIcon}
                mode="bleed"
                onClick={() => {
                  setPopoverOpen(false)
                  annotation.onRemove()
                }}
                ref={(el) => {
                  if (el) buttonRefs.current.set(`delete-${annotation.key}`, el)
                }}
                tabIndex={0}
                tone="critical"
                tooltipProps={null}
              />
            </Flex>
          ))}
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
