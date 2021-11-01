import React, {FunctionComponent, useCallback, useEffect, useMemo, useRef, useState} from 'react'
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
  Theme,
  ThemeColorToneKey,
  Tooltip,
  Stack,
  Popover,
  Box,
  Inline,
  Button,
  useClickOutside,
} from '@sanity/ui'
import {hues} from '@sanity/color'
import {EditIcon, TrashIcon} from '@sanity/icons'
import Markers from '../legacyParts/Markers'
import {RenderCustomMarkers} from '../types'

type Props = {
  attributes: RenderAttributes
  children: JSX.Element
  hasError: boolean
  isEditing: boolean
  markers: Marker[]
  onFocus: (path: Path) => void
  renderCustomMarkers: RenderCustomMarkers
  type: Type
  value: PortableTextChild
}

type AnnotationStyleProps = {
  isEditing: boolean
  $toneKey?: ThemeColorToneKey
  theme: Theme
}

function annotationStyle(props: AnnotationStyleProps) {
  const {$toneKey, theme, isEditing} = props

  const toneVariant = isEditing ? 'pressed' : 'enabled'

  return css`
    text-decoration: none;
    display: inline;
    background-color: ${theme.sanity.color.selectable[$toneKey][toneVariant].bg};
    border-bottom: 1px dashed ${theme.sanity.color.selectable[$toneKey][toneVariant].fg};
    color: ${theme.sanity.color.selectable[$toneKey][toneVariant].fg};

    &[data-link] {
      border-bottom: 1px solid ${theme.sanity.color.selectable[$toneKey][toneVariant].fg};
    }

    &[data-markers] {
      background-color: ${theme.sanity.color.dark ? hues.purple[950].hex : hues.purple[50].hex};
    }

    &[data-error] {
      background-color: ${theme.sanity.color.muted.critical.hovered.bg};
    }

    ${!isEditing &&
    css`
      @media (hover: hover) {
        &:hover {
          background-color: ${theme.sanity.color.selectable[$toneKey].hovered.bg};
          border-color: ${theme.sanity.color.selectable[$toneKey].hovered.fg};
          color: ${theme.sanity.color.selectable[$toneKey].hovered.fg};
        }
      }
    `}
  `
}

const TooltipStack = styled(Stack)`
  max-width: 250px;
`

const Root = styled.span<AnnotationStyleProps>(annotationStyle)

export const Annotation: FunctionComponent<Props> = ({
  attributes,
  children,
  hasError,
  isEditing,
  markers,
  onFocus,
  renderCustomMarkers,
  type,
  value,
}) => {
  const {path} = attributes
  const annotationRef = useRef<HTMLElement>(null)
  const [textElement, setTextElement] = useState(null)
  const [open, setOpen] = useState(false)
  const editor = usePortableTextEditor()

  const markDefPath = useMemo(() => [...path.slice(0, 1), 'markDefs', {_key: value._key}], [
    path,
    value._key,
  ])

  const text = useMemo(() => <span ref={setTextElement}>{children}</span>, [children])

  const markersToolTip = useMemo(
    () =>
      markers.length > 0 ? (
        <Tooltip
          placement="top"
          boundaryElement={annotationRef.current}
          portal="editor"
          content={
            <TooltipStack space={3} padding={2}>
              <Markers markers={markers} renderCustomMarkers={renderCustomMarkers} />
            </TooltipStack>
          }
        >
          {text}
        </Tooltip>
      ) : undefined,
    [markers, renderCustomMarkers, text]
  )

  const handleEditClick = useCallback((): void => {
    onFocus(markDefPath.concat(FOCUS_TERMINATOR))
  }, [markDefPath, onFocus])

  const handleRemoveClick = useCallback(
    (e): void => {
      e.preventDefault()
      e.stopPropagation()
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
    if (isLink) {
      return 'primary'
    }
    return 'default'
  }, [isLink, hasError])

  useEffect(() => {
    if (!textElement) return undefined
    function handleSelectionChange() {
      const selection = window.getSelection()
      const {anchorNode, focusNode} = selection
      if (annotationRef.current.contains(anchorNode) && annotationRef.current.contains(focusNode)) {
        setOpen(true)
      }
    }
    document.addEventListener('selectionchange', handleSelectionChange)
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [textElement])

  const [popoverContent, setPopoverContent] = useState(null)
  const handleSetCloseState = useCallback(() => {
    setOpen(false)
  }, [])
  useClickOutside(handleSetCloseState, [popoverContent])

  return (
    <Root
      $toneKey={toneKey}
      isEditing={isEditing}
      ref={annotationRef}
      data-link={isLink ? '' : undefined}
      data-error={hasError ? '' : undefined}
      data-markers={markers.length > 0 ? '' : undefined}
    >
      {markersToolTip || text}
      <Popover
        content={
          <Box padding={1} ref={setPopoverContent}>
            <Inline space={1}>
              <Button icon={EditIcon} mode="bleed" padding={2} onClick={handleEditClick} />
              <Button
                icon={TrashIcon}
                mode="bleed"
                padding={2}
                tone="critical"
                onClick={handleRemoveClick}
              />
            </Inline>
          </Box>
        }
        constrainSize
        open={open}
        placement="top"
        portal="default"
        referenceElement={annotationRef.current}
        scheme="dark"
      />
    </Root>
  )
}
