import {hues} from '@sanity/color'
import {
  EditorSelection,
  PortableTextEditor,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import {ObjectSchemaType, Path, PortableTextBlock, PortableTextChild} from '@sanity/types'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import styled, {css} from 'styled-components'
import {Box, Card, Theme, Tooltip} from '@sanity/ui'
import {BlockProps, RenderCustomMarkers, RenderPreviewCallback} from '../../../types'
import {useFormBuilder} from '../../../useFormBuilder'
import {usePortableTextMarkers} from '../hooks/usePortableTextMarkers'
import {useMemberValidation} from '../hooks/useMemberValidation'
import {usePortableTextMemberItem} from '../hooks/usePortableTextMembers'
import {pathToString} from '../../../../field/paths'
import {InlineObjectToolbarPopover} from './InlineObjectToolbarPopover'

interface InlineObjectProps {
  focused: boolean
  selected: boolean
  path: Path
  onItemClose: () => void
  onItemOpen: (path: Path) => void
  readOnly?: boolean
  renderCustomMarkers?: RenderCustomMarkers
  renderPreview: RenderPreviewCallback
  scrollElement: HTMLElement | null
  schemaType: ObjectSchemaType
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

export const InlineObject = (props: InlineObjectProps) => {
  const {
    focused,
    onItemClose,
    onItemOpen,
    path,
    readOnly,
    renderCustomMarkers,
    renderPreview,
    scrollElement,
    selected,
    schemaType,
    value,
  } = props
  const {Markers} = useFormBuilder().__internal.components
  const editor = usePortableTextEditor()
  const markers = usePortableTextMarkers(path)
  const memberItem = usePortableTextMemberItem(pathToString(path))
  const {validation, hasError, hasWarning} = useMemberValidation(memberItem?.node)
  const hasValidationMarkers = validation.length > 0
  const [popoverOpen, setPopoverOpen] = useState<boolean>(true)
  const popoverTitle = schemaType?.title || schemaType.name

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

  const preview = useMemo(() => {
    return (
      <PreviewSpan>
        {renderPreview({
          fallbackTitle: 'Click to edit',
          layout: 'inline',
          schemaType,
          value,
        })}
      </PreviewSpan>
    )
  }, [renderPreview, schemaType, value])

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
      const point = {path, offset: 0}
      const selection = {anchor: point, focus: point}
      PortableTextEditor.delete(editor, selection, {mode: 'children'})
      PortableTextEditor.focus(editor)
    },
    [editor, path]
  )

  const openItem = useCallback((): void => {
    if (memberItem) {
      onItemOpen(memberItem.node.path)
      setPopoverOpen(false)
    }
  }, [memberItem, onItemOpen])

  const handlePopoverClose = useCallback(() => {
    if (memberItem?.member.open) {
      setPopoverOpen(true)
    }
    setPopoverOpen(false)
  }, [memberItem?.member.open])

  useEffect(() => {
    if (memberItem?.member.open) {
      setPopoverOpen(false)
    } else if (focused) {
      setPopoverOpen(true)
    } else {
      setPopoverOpen(false)
    }
  }, [editor, focused, memberItem?.member.open, selected])
  const DefaultComponent = useCallback(
    (defaultComponentProps: BlockProps) => {
      return (
        <>
          <Root
            contentEditable={false}
            data-focused={focused || undefined}
            data-invalid={hasError || undefined}
            data-markers={hasValidationMarkers || undefined}
            data-read-only={readOnly || undefined}
            data-selected={selected || undefined}
            data-warning={hasWarning || undefined}
            forwardedAs="span"
            onClick={readOnly ? openItem : undefined}
            onDoubleClick={openItem}
            tone={tone}
          >
            {defaultComponentProps.children}
          </Root>
          {defaultComponentProps.actions}
        </>
      )
    },
    [focused, hasError, hasValidationMarkers, hasWarning, openItem, readOnly, selected, tone]
  )
  const onRemove = useCallback(() => {
    const sel: EditorSelection = {focus: {path, offset: 0}, anchor: {path, offset: 0}}
    PortableTextEditor.delete(editor, sel, {mode: 'children'})
    // Focus will not stick unless this is done through a timeout when deleted through clicking the menu button.
    setTimeout(() => PortableTextEditor.focus(editor))
  }, [editor, path])

  const content = useMemo(() => {
    const CustomComponent = schemaType.components?.inlineBlock
    const componentProps = {
      actions:
        (!readOnly && memberItem?.elementRef?.current && (
          <InlineObjectToolbarPopover
            onClose={handlePopoverClose}
            onDelete={handleRemoveClick}
            onEdit={openItem}
            open={popoverOpen}
            referenceElement={memberItem?.elementRef?.current || null}
            scrollElement={scrollElement}
            title={popoverTitle}
          />
        )) ||
        undefined,
      focused,
      onClose: onItemClose,
      onOpen: openItem,
      onRemove,
      open: memberItem?.member.open || false,
      path: memberItem?.node.path || path,
      renderDefault: DefaultComponent,
      schemaType,
      selected,
      value: value as PortableTextBlock,
    }
    const children = markersToolTip || preview
    return CustomComponent ? (
      <CustomComponent {...componentProps}>{children}</CustomComponent>
    ) : (
      <DefaultComponent {...componentProps}>{children}</DefaultComponent>
    )
  }, [
    DefaultComponent,
    focused,
    handlePopoverClose,
    handleRemoveClick,
    markersToolTip,
    memberItem?.elementRef,
    memberItem?.member.open,
    memberItem?.node.path,
    onItemClose,
    onRemove,
    openItem,
    path,
    popoverOpen,
    popoverTitle,
    preview,
    readOnly,
    schemaType,
    scrollElement,
    selected,
    value,
  ])
  // Ensure that the memberItem?.elementRef is not set through useMemo or hooks. It needs to be the current.
  return <span ref={memberItem?.elementRef}>{content}</span>
}
