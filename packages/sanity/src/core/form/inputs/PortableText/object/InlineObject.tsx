import {
  EditorSelection,
  PortableTextEditor,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import {ObjectSchemaType, Path, PortableTextBlock, PortableTextChild} from '@sanity/types'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {Tooltip} from '@sanity/ui'
import {isEqual} from '@sanity/util/paths'
import {BlockProps, RenderCustomMarkers, RenderPreviewCallback} from '../../../types'
import {useFormBuilder} from '../../../useFormBuilder'
import {usePortableTextMarkers} from '../hooks/usePortableTextMarkers'
import {useMemberValidation} from '../hooks/useMemberValidation'
import {usePortableTextMemberItem} from '../hooks/usePortableTextMembers'
import {pathToString} from '../../../../field/paths'
import {EMPTY_ARRAY} from '../../../../util'
import {InlineObjectToolbarPopover} from './InlineObjectToolbarPopover'
import {ObjectEditModal} from './modals/ObjectEditModal'
import {PreviewSpan, Root, TooltipBox} from './InlineObject.styles'

interface InlineObjectProps {
  boundaryElement?: HTMLElement
  focused: boolean
  onItemClose: () => void
  onItemOpen: (path: Path) => void
  onPathFocus: (path: Path) => void
  path: Path
  readOnly?: boolean
  relativePath: Path
  renderCustomMarkers?: RenderCustomMarkers
  renderPreview: RenderPreviewCallback
  schemaType: ObjectSchemaType
  selected: boolean
  value: PortableTextChild
}

export const InlineObject = (props: InlineObjectProps) => {
  const {
    boundaryElement,
    focused,
    onItemClose,
    onItemOpen,
    onPathFocus,
    path,
    readOnly,
    relativePath,
    renderCustomMarkers,
    renderPreview,
    schemaType,
    selected,
    value,
  } = props
  const {Markers} = useFormBuilder().__internal.components
  const editor = usePortableTextEditor()
  const markers = usePortableTextMarkers(path)
  const memberItem = usePortableTextMemberItem(pathToString(path))
  const {validation, hasError, hasInfo, hasWarning} = useMemberValidation(memberItem?.node)
  const parentSchemaType = editor.schemaTypes.block
  const CustomComponent = schemaType.components?.inlineBlock
  const hasMarkers = markers.length > 0
  const selfSelection = useMemo(
    (): EditorSelection => ({
      anchor: {path: relativePath, offset: 0},
      focus: {path: relativePath, offset: 0},
    }),
    [relativePath]
  )

  const onRemove = useCallback(() => {
    PortableTextEditor.delete(editor, selfSelection, {mode: 'children'})
    PortableTextEditor.focus(editor)
  }, [selfSelection, editor])

  const onOpen = useCallback(() => {
    if (memberItem) {
      PortableTextEditor.blur(editor)
      onItemOpen(memberItem.node.path)
    }
  }, [editor, onItemOpen, memberItem])

  const onClose = useCallback(() => {
    onItemClose()
    PortableTextEditor.select(editor, selfSelection)
    PortableTextEditor.focus(editor)
  }, [onItemClose, editor, selfSelection])

  const isOpen = Boolean(memberItem?.member.open)
  const input = memberItem?.input
  const nodePath = memberItem?.node.path || EMPTY_ARRAY
  const referenceElement = memberItem?.elementRef?.current

  const presence = memberItem?.node.presence || EMPTY_ARRAY

  const componentProps: BlockProps | undefined = useMemo(
    () => ({
      __unstable_boundaryElement: boundaryElement || undefined,
      __unstable_referenceElement: referenceElement || undefined,
      children: input,
      focused,
      onClose,
      onOpen,
      onPathFocus,
      onRemove,
      open: isOpen,
      markers,
      member: memberItem?.member,
      parentSchemaType,
      path: nodePath,
      presence,
      readOnly: Boolean(readOnly),
      renderDefault: DefaultInlineObjectComponent,
      renderPreview,
      schemaType,
      selected,
      value: value as PortableTextBlock,
      validation,
    }),
    [
      boundaryElement,
      focused,
      input,
      isOpen,
      markers,
      memberItem?.member,
      nodePath,
      onClose,
      onOpen,
      onPathFocus,
      onRemove,
      parentSchemaType,
      presence,
      readOnly,
      referenceElement,
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

  return useMemo(
    () => (
      <span ref={memberItem?.elementRef} contentEditable={false}>
        <Tooltip
          placement="bottom"
          portal="editor"
          disabled={!tooltipEnabled}
          content={toolTipContent}
        >
          {/* This relative span must be here for the ToolTip to properly show */}
          <span style={{position: 'relative'}}>
            {(componentProps &&
              (CustomComponent ? (
                <CustomComponent {...componentProps} />
              ) : (
                <DefaultInlineObjectComponent {...componentProps} />
              ))) ||
              null}
          </span>
        </Tooltip>
      </span>
    ),
    [CustomComponent, componentProps, memberItem?.elementRef, toolTipContent, tooltipEnabled]
  )
}

export const DefaultInlineObjectComponent = (props: BlockProps) => {
  const {
    __unstable_boundaryElement,
    __unstable_referenceElement,
    children,
    focused,
    markers,
    onClose,
    onOpen,
    onRemove,
    open,
    path,
    readOnly,
    renderPreview,
    schemaType,
    selected,
    validation,
    value,
  } = props
  const hasMarkers = markers.length > 0
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

  const onClosePopover = useCallback(() => {
    setPopoverOpen(false)
  }, [])

  const autofocus = isEqual(path.slice(-2), ['children', {_key: value._key}])

  return (
    <>
      <Root
        data-focused={focused || undefined}
        data-invalid={hasError || undefined}
        data-markers={hasMarkers || undefined}
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
            skipVisibilityCheck: true,
            value,
            fallbackTitle: 'Click to edit',
          })}
        </PreviewSpan>
      </Root>
      {__unstable_referenceElement && (
        <InlineObjectToolbarPopover
          boundaryElement={__unstable_boundaryElement}
          onClosePopover={onClosePopover}
          onDelete={onRemove}
          onEdit={openItem}
          open={popoverOpen}
          referenceElement={__unstable_referenceElement}
          title={popoverTitle}
        />
      )}
      {open && (
        <ObjectEditModal
          boundaryElement={__unstable_boundaryElement}
          defaultType="popover"
          onClose={onClose}
          autofocus={autofocus}
          referenceElement={__unstable_referenceElement}
          schemaType={schemaType}
        >
          {children}
        </ObjectEditModal>
      )}
    </>
  )
}
