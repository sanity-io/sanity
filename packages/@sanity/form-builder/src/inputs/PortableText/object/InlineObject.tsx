import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {hues} from '@sanity/color'
import {
  PortableTextChild,
  Type,
  RenderAttributes,
  PortableTextEditor,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import {Marker, Path} from '@sanity/types'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import styled, {css} from 'styled-components'
import {Box, Card, Theme, Tooltip} from '@sanity/ui'
import Preview from '../../../Preview'
import {Markers} from '../../../legacyParts'
import {RenderCustomMarkers} from '../types'
import {EditObjectToolTip} from './InlineObjectToolbarPopover'

interface InlineObjectProps {
  attributes: RenderAttributes
  isEditing: boolean
  markers: Marker[]
  onFocus: (path: Path) => void
  readOnly: boolean
  renderCustomMarkers: RenderCustomMarkers
  scrollElement: HTMLElement
  type: Type
  value: PortableTextChild
}

function rootStyle({theme}: {theme: Theme}) {
  const {color, radius} = theme.sanity

  return css`
    line-height: 0;
    border-radius: ${radius[2]}px;
    padding: 2px;
    box-shadow: inset 0 0 0 1px var(--card-border-color);
    height: calc(1em - 1px);
    margin-top: 0.0625em;

    & > div:after {
      content: '';
    }

    &:not([hidden]) {
      display: inline-flex;
      align-items: center;
      vertical-align: top;
    }

    &[data-ready-only] {
      cursor: default;
    }

    &[data-focused] {
      box-shadow: inset 0 0 0 1px ${color.selectable.primary.selected.border};
      color: ${color.selectable.primary.pressed.fg};
    }

    &:not([data-focused]):not([data-selected]) {
      @media (hover: hover) {
        &:hover {
          --card-border-color: ${color.input.default.hovered.border};
        }
      }
    }

    &[data-markers] {
      --card-bg-color: ${color.dark ? hues.purple[950].hex : hues.purple[50].hex};
    }

    &[data-warning] {
      --card-bg-color: ${color.muted.caution.hovered.bg};

      @media (hover: hover) {
        &:hover {
          --card-border-color: ${color.muted.caution.hovered.border};
        }
      }
    }

    &[data-invalid] {
      --card-bg-color: ${color.input.invalid.enabled.bg};
      --card-border-color: ${color.input.invalid.enabled.border};

      @media (hover: hover) {
        &:hover {
          --card-border-color: ${color.input.invalid.hovered.border};
        }
      }
    }
  `
}

const Root = styled(Card)(rootStyle)

const PreviewSpan = styled.span`
  display: block;
  max-width: calc(5em + 80px);
  position: relative;
`

const TooltipBox = styled(Box)`
  max-width: 250px;
`

export const InlineObject = React.forwardRef(function InlineObject(
  props: InlineObjectProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>
) {
  const {
    attributes: {focused, selected, path},
    isEditing,
    markers,
    onFocus,
    readOnly,
    renderCustomMarkers,
    scrollElement,
    type,
    value,
  } = props
  const editor = usePortableTextEditor()
  const refElm = useRef(null)
  const [popoverOpen, setPopoverOpen] = useState(false)

  const hasError = useMemo(
    () =>
      markers.filter((marker) => marker.type === 'validation' && marker.level === 'error').length >
      0,
    [markers]
  )

  const hasWarning = useMemo(
    () =>
      markers.filter((marker) => marker.type === 'validation' && marker.level === 'warning')
        .length > 0,
    [markers]
  )

  const hasMarkers = markers.length > 0

  const tone = useMemo(() => {
    if (hasError) {
      return 'critical'
    }

    if (hasWarning) {
      return 'caution'
    }

    if (selected || focused) {
      return 'primary'
    }

    return undefined
  }, [focused, hasError, hasWarning, selected])

  const preview = useMemo(
    () => (
      <PreviewSpan>
        <Preview type={type} value={value} fallbackTitle="Click to edit" layout="inline" />
      </PreviewSpan>
    ),
    [type, value]
  )

  const markersToolTip = useMemo(
    () =>
      markers.length > 0 ? (
        <Tooltip
          placement="top"
          portal="editor"
          content={
            <TooltipBox padding={2}>
              <Markers markers={markers} renderCustomMarkers={renderCustomMarkers} />
            </TooltipBox>
          }
        >
          {preview}
        </Tooltip>
      ) : undefined,
    [markers, preview, renderCustomMarkers]
  )

  const handleEditClick = useCallback((): void => {
    PortableTextEditor.blur(editor)
    onFocus(path.concat(FOCUS_TERMINATOR))
    setPopoverOpen(false)
  }, [editor, path, onFocus])

  const handleRemoveClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      event.preventDefault()
      event.stopPropagation()
      const point = {path, offset: 0}
      const selection = {anchor: point, focus: point}
      PortableTextEditor.delete(editor, selection, {mode: 'children'})
    },
    [editor, path]
  )

  useEffect(() => {
    if (isEditing) {
      setPopoverOpen(false)
    } else if (focused) {
      setPopoverOpen(true)
    } else {
      setPopoverOpen(false)
    }
  }, [editor, focused, isEditing, selected])

  return (
    <>
      <Root
        data-focused={focused || undefined}
        data-invalid={hasError || undefined}
        data-warning={hasWarning || undefined}
        data-selected={selected || undefined}
        data-read-only={readOnly || undefined}
        data-markers={hasMarkers || undefined}
        tone={tone}
        forwardedAs="span"
        contentEditable={false}
        ref={forwardedRef}
      >
        <span ref={refElm} onDoubleClick={handleEditClick}>
          {markersToolTip || preview}
        </span>
      </Root>
      {!readOnly && !isEditing && (
        <EditObjectToolTip
          onDelete={handleRemoveClick}
          onEdit={handleEditClick}
          open={popoverOpen}
          referenceElement={refElm.current}
          scrollElement={scrollElement}
          setOpen={setPopoverOpen}
          title={type?.title || type.name}
        />
      )}
    </>
  )
})
