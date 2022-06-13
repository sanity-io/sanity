import {hues} from '@sanity/color'
import {
  PortableTextChild,
  Type,
  RenderAttributes,
  PortableTextEditor,
  usePortableTextEditor,
  usePortableTextEditorSelection,
} from '@sanity/portable-text-editor'
import {Path} from '@sanity/types'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import styled, {css} from 'styled-components'
import {Box, Card, Theme, Tooltip} from '@sanity/ui'
import {RenderCustomMarkers, FIXME, RenderPreviewCallback} from '../../../types'
import {useFormBuilder} from '../../../useFormBuilder'
import {PortableTextEditorElement} from '../Compositor'
import {usePortableTextMarkers} from '../hooks/usePortableTextMarkers'
import {useMemberValidation} from '../hooks/useMemberValidation'
import {usePortableTextMemberItem} from '../hooks/usePortableTextMembers'
import {pathToString} from '../../../../field/paths'
import {InlineObjectToolbarPopover} from './InlineObjectToolbarPopover'

interface InlineObjectProps {
  attributes: RenderAttributes
  onOpenItem: (path: Path) => void
  readOnly?: boolean
  renderCustomMarkers?: RenderCustomMarkers
  renderPreview: RenderPreviewCallback
  scrollElement: HTMLElement | null
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
    cursor: default;

    &:not([hidden]) {
      display: inline-flex;
      align-items: center;
      vertical-align: top;
    }

    &[data-ready-only] {
      cursor: default;
    }

    &[data-focused] {
      box-shadow: inset 0 0 0 1px ${color.selectable?.primary.selected.border};
      color: ${color.selectable?.primary.pressed.fg};
    }

    &[data-selected] {
      background-color: ${color.selectable?.primary.pressed.bg};
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
  forwardedRef: React.ForwardedRef<PortableTextEditorElement>
) {
  const {
    attributes: {focused, selected, path},
    onOpenItem,
    readOnly,
    renderCustomMarkers,
    renderPreview,
    scrollElement,
    type,
    value,
  } = props
  const {Markers} = useFormBuilder().__internal.components
  const editor = usePortableTextEditor()
  const editorSelection = usePortableTextEditorSelection()
  const markers = usePortableTextMarkers(path)
  const memberItem = usePortableTextMemberItem(pathToString(path))
  const {validation, hasError, hasWarning} = useMemberValidation(memberItem?.node)
  const hasValidationMarkers = validation.length > 0
  const [showPopover, setShowPopover] = useState(false)

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

  useEffect(() => {
    if (memberItem?.elementRef?.current) {
      setShowPopover(!readOnly && focused && selected)
    }
  }, [focused, selected, editorSelection, memberItem?.elementRef, readOnly])

  const preview = useMemo(
    () => (
      <PreviewSpan>
        {renderPreview({
          fallbackTitle: 'Click to edit',
          layout: 'inline',
          schemaType: type as FIXME,
          value,
        })}
      </PreviewSpan>
    ),

    [renderPreview, type, value]
  )

  const markersToolTip = useMemo(
    () =>
      markers.length > 0 || validation.length > 0 ? (
        <Tooltip
          placement="bottom"
          portal="editor"
          content={
            <TooltipBox padding={2}>
              <Markers
                markers={markers}
                validation={validation}
                renderCustomMarkers={renderCustomMarkers}
              />
            </TooltipBox>
          }
        >
          {preview}
        </Tooltip>
      ) : undefined,
    [Markers, markers, validation, preview, renderCustomMarkers]
  )

  const handleRemoveClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      event.preventDefault()
      event.stopPropagation()
      setShowPopover(false)
      const point = {path, offset: 0}
      const selection = {anchor: point, focus: point}
      PortableTextEditor.delete(editor, selection, {mode: 'children'})
      PortableTextEditor.focus(editor)
    },
    [editor, path]
  )

  const handleEditClick = useCallback((): void => {
    setShowPopover(false)
    PortableTextEditor.blur(editor)
    if (memberItem) {
      onOpenItem(memberItem.node.path)
    }
  }, [editor, memberItem, onOpenItem])

  return (
    <>
      <Root
        data-focused={focused || undefined}
        data-invalid={hasError || undefined}
        data-warning={hasWarning || undefined}
        data-selected={selected || undefined}
        data-read-only={readOnly || undefined}
        data-markers={hasValidationMarkers || undefined}
        tone={tone}
        forwardedAs="span"
        contentEditable={false}
        ref={memberItem?.elementRef as React.RefObject<HTMLDivElement>}
      >
        <span ref={forwardedRef} onDoubleClick={handleEditClick}>
          {markersToolTip || preview}
        </span>
      </Root>
      {showPopover && (
        <InlineObjectToolbarPopover
          open={showPopover}
          setOpen={setShowPopover}
          onDelete={handleRemoveClick}
          onEdit={handleEditClick}
          referenceElement={memberItem?.elementRef?.current || null}
          scrollElement={scrollElement}
          title={type?.title || type.name}
        />
      )}
    </>
  )
})
