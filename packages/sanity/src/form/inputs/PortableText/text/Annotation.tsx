import {hues} from '@sanity/color'
import {
  PortableTextChild,
  PortableTextEditor,
  RenderAttributes,
  usePortableTextEditor,
  usePortableTextEditorSelection,
} from '@sanity/portable-text-editor'
import {ObjectSchemaType, Path} from '@sanity/types'
import {Box, Theme, ThemeColorToneKey, Tooltip} from '@sanity/ui'
import React, {SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import styled, {css} from 'styled-components'
import {FIXME, RenderCustomMarkers} from '../../../types'
import {DefaultMarkers} from '../_legacyDefaultParts/Markers'
import {useFormBuilder} from '../../../useFormBuilder'
import {useMemberValidation} from '../hooks/useMemberValidation'
import {usePortableTextMarkers} from '../hooks/usePortableTextMarkers'
import {usePortableTextMemberItem} from '../hooks/usePortableTextMembers'
import {pathToString} from '../../../../field/paths'
import {AnnotationToolbarPopover} from './AnnotationToolbarPopover'

interface AnnotationProps {
  attributes: RenderAttributes
  children: JSX.Element
  onOpenItem: (path: Path) => void
  readOnly?: boolean
  renderCustomMarkers?: RenderCustomMarkers
  scrollElement: HTMLElement | null
  type: ObjectSchemaType
  value: PortableTextChild
}

const Root = styled.span<{$toneKey?: Exclude<ThemeColorToneKey, 'transparent'>}>(
  (props: {$toneKey?: Exclude<ThemeColorToneKey, 'transparent'>; theme: Theme}) => {
    const {$toneKey = 'default', theme} = props

    return css`
      text-decoration: none;
      display: inline;
      background-color: ${theme.sanity.color.selectable?.[$toneKey].enabled.bg};
      border-bottom: 1px dashed ${theme.sanity.color.selectable?.[$toneKey].enabled.fg};
      color: ${theme.sanity.color.selectable?.[$toneKey].enabled.fg};

      &[data-link] {
        border-bottom: 1px solid ${theme.sanity.color.selectable?.[$toneKey].enabled.fg};
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

export const Annotation = function Annotation(props: AnnotationProps) {
  const {
    attributes: {focused, path, selected},
    children,
    onOpenItem,
    renderCustomMarkers,
    scrollElement,
    readOnly,
    type,
    value,
  } = props
  const {Markers = DefaultMarkers} = useFormBuilder().__internal.components
  const annotationRef = useRef<HTMLElement>(null)
  const editor = usePortableTextEditor()
  const editorSelection = usePortableTextEditorSelection()
  const markDefPath = useMemo(
    () => [path[0]].concat(['markDefs', {_key: value._key}]),
    [path, value._key]
  )
  const [textElement, setTextElement] = useState<HTMLSpanElement | null>(null)
  const memberItem = usePortableTextMemberItem(pathToString(markDefPath))
  const {validation, hasError, hasWarning} = useMemberValidation(memberItem?.node)
  const markers = usePortableTextMarkers(path)
  const [showPopover, setShowPopover] = useState(false)

  const text = useMemo(
    () => (
      <span ref={setTextElement} data-annotation="">
        {children}
      </span>
    ),

    [children]
  )

  useEffect(() => {
    setShowPopover(true)
  }, [editorSelection])

  useEffect(() => {
    if (memberItem?.elementRef?.current) {
      setShowPopover(!readOnly && focused && selected)
    }
  }, [focused, selected, memberItem?.elementRef, readOnly])

  const markersToolTip = useMemo(
    () =>
      validation.length > 0 || markers.length > 0 ? (
        <Tooltip
          placement="bottom"
          portal="default"
          content={
            <TooltipBox padding={2}>
              <Markers
                markers={markers}
                renderCustomMarkers={renderCustomMarkers}
                validation={validation}
              />
            </TooltipBox>
          }
        >
          <span>{text}</span>
        </Tooltip>
      ) : undefined,
    [Markers, markers, renderCustomMarkers, text, validation]
  )

  const handleEditClick = useCallback(
    (event: SyntheticEvent): void => {
      setShowPopover(false)
      PortableTextEditor.blur(editor)
      event.preventDefault()
      event.stopPropagation()
      if (memberItem) {
        onOpenItem(memberItem.node.path)
      }
    },
    [editor, memberItem, onOpenItem]
  )

  const handleRemoveClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      event.preventDefault()
      event.stopPropagation()
      PortableTextEditor.removeAnnotation(editor, type as FIXME)
      PortableTextEditor.focus(editor)
    },
    [editor, type]
  )

  const isLink = type.name === 'link'

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

  const hasCustomMarkers = markers.length > 0

  return (
    <Root
      $toneKey={toneKey}
      ref={annotationRef}
      data-link={isLink ? '' : undefined}
      data-error={hasError ? '' : undefined}
      data-warning={hasWarning ? '' : undefined}
      data-custom-markers={hasCustomMarkers ? '' : undefined}
    >
      <span ref={memberItem?.elementRef}>{markersToolTip || text}</span>
      {showPopover && (
        <AnnotationToolbarPopover
          focused={focused}
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
}
