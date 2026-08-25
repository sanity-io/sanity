import {PortableTextEditor, usePortableTextEditor} from '@portabletext/editor'
import {EditIcon} from '@sanity/icons/Edit'
import {TrashIcon} from '@sanity/icons/Trash'
import {Flex, Text, useBoundaryElement, useGlobalKeyDown, useTheme} from '@sanity/ui'
import {
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {Box} from 'ui5'

import {Button} from '../../../../../ui-components/button/Button'
import {Popover, type PopoverProps} from '../../../../../ui-components/popover/Popover'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useSelectedAnnotations} from '../contexts/SelectedAnnotationsContext'
import {usePortableTextMemberItems} from '../hooks/usePortableTextMembers'

const POPOVER_FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = ['top', 'bottom']

interface CombinedAnnotationPopoverProps {
  annotationOpeningRef: RefObject<boolean>
  referenceBoundary: HTMLElement | null
}

export function CombinedAnnotationPopover(props: CombinedAnnotationPopoverProps): ReactNode {
  const {annotationOpeningRef, referenceBoundary} = props
  const {element: floatingBoundary} = useBoundaryElement()
  const {annotations} = useSelectedAnnotations()
  const portableTextMemberItems = usePortableTextMemberItems()

  // The popover must stay closed for the whole lifetime of the annotation
  // edit modal, not only while it is opening: when multiple annotations cover
  // the same text, the ones not being edited stay registered while the modal
  // is open, and a selection re-check could otherwise reopen the popover on
  // top of the modal.
  const hasOpenAnnotation = portableTextMemberItems.some(
    (m) => m.kind === 'annotation' && m.member.open,
  )
  const [cursorRect, setCursorRect] = useState<DOMRect | null>(null)
  const [popoverOpen, setPopoverOpen] = useState<boolean>(false)
  const rangeRef = useRef<Range | null>(null)
  const {sanity} = useTheme()
  const {t} = useTranslation()
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const editor = usePortableTextEditor()
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
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
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
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
    // Don't show the popover while an annotation object edit modal is opening
    // or open. Right after inserting an annotation (or clicking "Edit" on
    // one), the editor renders the annotated text as selected before the form
    // state reflects the member as open (`annotationOpeningRef` covers that
    // window), and the popover must stay closed while the modal is open
    // (`hasOpenAnnotation`).
    if (annotationOpeningRef.current || hasOpenAnnotation) {
      setPopoverOpen(false)
      setCursorRect(null)
      return
    }

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
  }, [annotations, annotationOpeningRef, hasOpenAnnotation])

  // Listen for selection changes
  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange, {passive: true})
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [handleSelectionChange])

  // Re-check selection when annotations register or unregister.
  // Annotation components register with the context after React processes
  // the editor's selection change, which happens after the DOM
  // selectionchange event has already fired. Without this, the popover
  // misses the first click because annotations.length is still 0 when
  // selectionchange runs.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- pre-existing violation, to be fixed in a follow-up
    handleSelectionChange()
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
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- pre-existing violation, to be fixed in a follow-up
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
              <Box padding={2} flexBasis="0%" flexGrow={1}>
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
