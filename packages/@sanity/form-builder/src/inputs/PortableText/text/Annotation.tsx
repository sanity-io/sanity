import React, {SyntheticEvent, useCallback, useMemo, useRef, useState} from 'react'
import {
  PortableTextChild,
  PortableTextEditor,
  RenderAttributes,
  Type,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import {isValidationMarker, Marker, Path} from '@sanity/types'
import styled, {css} from 'styled-components'
import {Box, Theme, ThemeColorToneKey, Tooltip} from '@sanity/ui'
import {hues} from '@sanity/color'
import Markers from '../_legacyDefaultParts/Markers'
import {RenderCustomMarkers} from '../types'
import {AnnotationToolbarPopover} from './'

interface AnnotationProps {
  attributes: RenderAttributes
  children: JSX.Element
  hasError: boolean
  hasWarning: boolean
  markers: Marker[]
  onFocus: (path: Path) => void
  renderCustomMarkers: RenderCustomMarkers
  type: Type
  readOnly: boolean
  value: PortableTextChild
  scrollElement: HTMLElement
}

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

      &[data-custom-markers] {
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

const TooltipBox = styled(Box).attrs({forwardedAs: 'span'})`
  max-width: 250px;
`

export const Annotation = React.forwardRef(function Annotation(
  props: AnnotationProps,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>
) {
  const {
    attributes,
    children,
    hasError,
    hasWarning,
    markers,
    onFocus,
    renderCustomMarkers,
    scrollElement,
    readOnly,
    type,
    value,
  } = props
  const {path} = attributes
  const annotationRef = useRef<HTMLElement>(null)
  const editor = usePortableTextEditor()
  const markDefPath = useMemo(() => [path[0], 'markDefs', {_key: value._key}], [path, value._key])
  const [textElement, setTextElement] = useState<HTMLSpanElement | null>(null)

  const text = useMemo(
    () => (
      <span ref={setTextElement} data-annotation="">
        {children}
      </span>
    ),
    [children]
  )

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

  const handleEditClick = useCallback(
    (event: SyntheticEvent): void => {
      event.preventDefault()
      event.stopPropagation()
      PortableTextEditor.blur(editor)
      onFocus(markDefPath.concat(FOCUS_TERMINATOR))
    },
    [editor, markDefPath, onFocus]
  )

  const handleRemoveClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      event.preventDefault()
      event.stopPropagation()
      PortableTextEditor.removeAnnotation(editor, type)
      PortableTextEditor.focus(editor)
    },
    [editor, type]
  )

  const isLink = value?._type === 'link'

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

  const hasCustomMarkers = markers.filter((m) => !isValidationMarker(m)).length > 0

  const handleReadOnlyClick = useCallback(() => onFocus(markDefPath.concat(FOCUS_TERMINATOR)), [
    markDefPath,
    onFocus,
  ])

  return (
    <Root
      $toneKey={toneKey}
      ref={annotationRef}
      data-link={isLink ? '' : undefined}
      data-error={hasError ? '' : undefined}
      data-warning={hasWarning ? '' : undefined}
      data-custom-markers={hasCustomMarkers ? '' : undefined}
      onClick={readOnly ? handleReadOnlyClick : undefined}
    >
      <span ref={forwardedRef}>{markersToolTip || text}</span>
      {attributes.focused && !readOnly && (
        <AnnotationToolbarPopover
          textElement={textElement}
          annotationElement={annotationRef?.current}
          scrollElement={scrollElement}
          onEdit={handleEditClick}
          onDelete={handleRemoveClick}
          title={type?.title || type.name}
        />
      )}
    </Root>
  )
})
