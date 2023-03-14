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
import {EMPTY_ARRAY} from '../../../../util'
import {useChildPresence} from '../../../studio/contexts/Presence'
import {InlineObjectToolbarPopover} from './InlineObjectToolbarPopover'
import {ObjectEditModal} from './renderers/ObjectEditModal'

interface InlineObjectProps {
  boundaryElement?: HTMLElement
  focused: boolean
  selected: boolean
  path: Path
  onItemClose: () => void
  onPathFocus: (path: Path) => void
  onItemOpen: (path: Path) => void
  readOnly?: boolean
  renderCustomMarkers?: RenderCustomMarkers
  renderPreview: RenderPreviewCallback
  schemaType: ObjectSchemaType
  value: PortableTextChild
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
    boundaryElement,
    focused,
    onItemClose,
    onItemOpen,
    onPathFocus,
    path,
    readOnly,
    renderCustomMarkers,
    renderPreview,
    selected,
    schemaType,
    value,
  } = props
  const {Markers} = useFormBuilder().__internal.components
  const editor = usePortableTextEditor()
  const markers = usePortableTextMarkers(path)
  const memberItem = usePortableTextMemberItem(pathToString(path))
  const {validation, hasError, hasInfo, hasWarning} = useMemberValidation(memberItem?.node)
  const presence = useChildPresence(memberItem?.node.path || EMPTY_ARRAY, !!memberItem)
  const parentSchemaType = editor.schemaTypes.block
  const CustomComponent = schemaType.components?.inlineBlock
  const hasMarkers = markers.length > 0

  const onRemove = useCallback(() => {
    const sel: EditorSelection = {focus: {path, offset: 0}, anchor: {path, offset: 0}}
    PortableTextEditor.delete(editor, sel, {mode: 'children'})
    // Focus will not stick unless this is done through a timeout when deleted through clicking the menu button.
    setTimeout(() => PortableTextEditor.focus(editor))
  }, [editor, path])

  const onOpen = useCallback(() => {
    if (memberItem) {
      onItemOpen(memberItem?.node.path)
    }
  }, [memberItem, onItemOpen])

  const componentProps: BlockProps = useMemo(
    () => ({
      __unstable_boundaryElement: boundaryElement || undefined,
      __unstable_referenceElement: memberItem?.elementRef?.current || undefined,
      children: memberItem?.input,
      focused,
      onClose: onItemClose,
      onOpen,
      onPathFocus,
      onRemove,
      open: memberItem?.member.open || false,
      markers,
      member: memberItem?.member,
      parentSchemaType,
      path: memberItem?.node.path || EMPTY_ARRAY,
      presence,
      readOnly: Boolean(readOnly),
      renderDefault: DefaultComponent,
      renderPreview,
      schemaType,
      selected,
      value: value as PortableTextBlock,
      validation,
    }),
    [
      boundaryElement,
      focused,
      markers,
      memberItem?.elementRef,
      memberItem?.input,
      memberItem?.member,
      memberItem?.node.path,
      onItemClose,
      onOpen,
      onPathFocus,
      onRemove,
      parentSchemaType,
      presence,
      readOnly,
      renderPreview,
      schemaType,
      selected,
      validation,
      value,
    ]
  )

  // Tooltip indicating validation errors, warnings, info and markers
  const tooltipEnabled = hasError || hasWarning || hasInfo || hasMarkers
  const toolTipContent = useMemo(
    () =>
      (tooltipEnabled && (
        <TooltipBox padding={2}>
          <Markers
            markers={markers}
            validation={validation}
            renderCustomMarkers={renderCustomMarkers}
          />
        </TooltipBox>
      )) ||
      null,
    [Markers, markers, renderCustomMarkers, tooltipEnabled, validation]
  )

  return (
    <span ref={memberItem?.elementRef} contentEditable={false}>
      <Tooltip
        placement="bottom"
        portal="editor"
        disabled={!tooltipEnabled}
        content={toolTipContent}
      >
        {/* This relative span must be here for the ToolTip to properly show */}
        <span style={{position: 'relative'}}>
          {CustomComponent ? (
            <CustomComponent {...componentProps} />
          ) : (
            <DefaultComponent {...componentProps} />
          )}
        </span>
      </Tooltip>
    </span>
  )
}

const DefaultComponent = (props: BlockProps) => {
  const {
    __unstable_boundaryElement,
    __unstable_referenceElement,
    children,
    focused,
    member,
    onClose,
    onOpen,
    onRemove,
    open,
    readOnly,
    renderPreview,
    schemaType,
    selected,
    validation,
    value,
  } = props
  const hasValidationMarkers = validation.length > 0
  const [popoverOpen, setPopoverOpen] = useState<boolean>(false)
  const popoverTitle = schemaType?.title || schemaType.name
  const hasError = validation.filter((v) => v.level === 'error').length > 0
  const hasWarning = validation.filter((v) => v.level === 'warning').length > 0

  const openItem = useCallback((): void => {
    setPopoverOpen(false)
    onOpen()
  }, [onOpen])

  useEffect(() => {
    if (open) {
      setPopoverOpen(false)
    } else if (focused) {
      setPopoverOpen(true)
    } else {
      setPopoverOpen(false)
    }
  }, [focused, open])

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

  const handlePopoverClose = useCallback(() => {
    if (open) {
      setPopoverOpen(true)
      return
    }
    setPopoverOpen(false)
    onClose()
  }, [onClose, open])

  return (
    <>
      <Root
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
        <PreviewSpan>
          {renderPreview({
            layout: 'inline',
            schemaType,
            value,
            fallbackTitle: 'Click to edit',
          })}
        </PreviewSpan>
      </Root>
      {__unstable_referenceElement && (
        <InlineObjectToolbarPopover
          boundaryElement={__unstable_boundaryElement}
          onClose={handlePopoverClose}
          onDelete={onRemove}
          onEdit={openItem}
          open={popoverOpen}
          referenceElement={__unstable_referenceElement}
          title={popoverTitle}
        />
      )}
      {member?.open && (
        <ObjectEditModal
          member={member}
          modalType="popover"
          onClose={onClose}
          referenceElement={__unstable_referenceElement}
          boundaryElement={__unstable_boundaryElement}
        >
          {children}
        </ObjectEditModal>
      )}
    </>
  )
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
