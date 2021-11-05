import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
  PortableTextChild,
  PortableTextEditor,
  RenderAttributes,
  Type,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import {Marker, Path} from '@sanity/types'
import styled, {css} from 'styled-components'
import {
  Box,
  Button,
  Inline,
  Popover,
  PopoverProps,
  Text,
  Theme,
  ThemeColorToneKey,
  Tooltip,
  useGlobalKeyDown,
  useTheme,
} from '@sanity/ui'
import {hues} from '@sanity/color'
import {EditIcon, TrashIcon} from '@sanity/icons'
import Markers from '../_legacyDefaultParts/Markers'
import {RenderCustomMarkers} from '../types'

interface AnnotationProps {
  attributes: RenderAttributes
  children: JSX.Element
  hasError: boolean
  hasWarning: boolean
  markers: Marker[]
  onFocus: (path: Path) => void
  renderCustomMarkers: RenderCustomMarkers
  type: Type
  value: PortableTextChild
  scrollElement: HTMLElement
}

const POPOVER_FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = ['top', 'bottom']

const Root = styled.span<{$toneKey?: ThemeColorToneKey}>(
  (props: {$toneKey?: ThemeColorToneKey; theme: Theme}) => {
    const {$toneKey, theme} = props

    return css`
      text-decoration: none;
      display: inline;
      background-color: ${theme.sanity.color.selectable[$toneKey].enabled.bg};
      border-bottom: 1px dashed ${theme.sanity.color.selectable[$toneKey].enabled.fg};
      color: ${theme.sanity.color.selectable[$toneKey].enabled.fg};

      &[data-link] {
        border-bottom: 1px solid ${theme.sanity.color.selectable[$toneKey].enabled.fg};
      }

      &[data-markers] {
        background-color: ${theme.sanity.color.dark ? hues.purple[950].hex : hues.purple[50].hex};
      }

      &[data-warning] {
        background-color: ${theme.sanity.color.muted.caution.hovered.bg};
      }

      &[data-error] {
        background-color: ${theme.sanity.color.muted.critical.hovered.bg};
      }
    `
  }
)

const TooltipBox = styled(Box)`
  max-width: 250px;
`

const ToolbarPopover = styled(Popover)`
  &[data-popper-reference-hidden='true'] {
    display: none !important;
  }
`

export function Annotation(props: AnnotationProps) {
  const {
    attributes,
    children,
    hasError,
    hasWarning,
    markers,
    onFocus,
    renderCustomMarkers,
    scrollElement,
    type,
    value,
  } = props
  const {path} = attributes
  const annotationRef = useRef<HTMLElement>(null)
  const editor = usePortableTextEditor()
  const markDefPath = useMemo(() => [path[0], 'markDefs', {_key: value._key}], [path, value._key])
  const {sanity} = useTheme()

  // -------------- Popover ------------- //
  const [textElement, setTextElement] = useState<HTMLSpanElement | null>(null)
  const [open, setOpen] = useState<boolean>(false)
  const [cursorRect, setCursorRect] = useState<DOMRect | null>(null)
  const [selection, setSelection] = useState(null)
  const isClosingRef = useRef<boolean>(false)
  const rangeRef = useRef<Range | null>(null)

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

    const annotationElement = annotationRef.current

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
  }, [selection])
  // -------------- End popover ------------- //

  const text = useMemo(
    () => (
      <span ref={setTextElement} data-annotation="">
        {children}
      </span>
    ),
    [children]
  )

  const popoverScheme = useMemo(() => (sanity.color.dark ? 'light' : 'dark'), [sanity.color.dark])

  const markersToolTip = useMemo(
    () =>
      markers.length > 0 ? (
        <Tooltip
          placement="top"
          boundaryElement={annotationRef.current}
          portal="default"
          content={
            <TooltipBox padding={2}>
              <Markers markers={markers} renderCustomMarkers={renderCustomMarkers} />
            </TooltipBox>
          }
        >
          <span>{text}</span>
        </Tooltip>
      ) : undefined,
    [markers, renderCustomMarkers, text]
  )

  const handleEditClick = useCallback((): void => {
    setOpen(false)
    onFocus(markDefPath.concat(FOCUS_TERMINATOR))
  }, [markDefPath, onFocus])

  const handleRemoveClick = useCallback(
    (e): void => {
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
      PortableTextEditor.removeAnnotation(editor, type)
      PortableTextEditor.focus(editor)
    },
    [editor, type]
  )

  const isLink = useMemo(() => value?._type === 'link', [value])

  const toneKey = useMemo(() => {
    if (hasError) {
      return 'critical'
    }

    if (hasWarning) {
      return 'caution'
    }

    if (isLink) {
      return 'primary'
    }
    return 'default'
  }, [isLink, hasError, hasWarning])

  return (
    <Root
      $toneKey={toneKey}
      ref={annotationRef}
      data-link={isLink ? '' : undefined}
      data-error={hasError ? '' : undefined}
      data-warning={hasWarning ? '' : undefined}
      data-markers={markers.length > 0 ? '' : undefined}
    >
      {markersToolTip || text}
      <ToolbarPopover
        boundaryElement={scrollElement}
        constrainSize
        content={
          <Box padding={1}>
            <Inline space={1}>
              <Box padding={2}>
                <Text weight="semibold" size={1}>
                  {type?.title || type.name}
                </Text>
              </Box>
              <Button icon={EditIcon} mode="bleed" onClick={handleEditClick} padding={2} />
              <Button
                icon={TrashIcon}
                mode="bleed"
                padding={2}
                onClick={handleRemoveClick}
                tone="critical"
              />
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
    </Root>
  )
}
