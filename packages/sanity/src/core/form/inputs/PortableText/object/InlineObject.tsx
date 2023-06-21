import {
  EditorSelection,
  PortableTextEditor,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import {ObjectSchemaType, Path, PortableTextBlock, PortableTextChild} from '@sanity/types'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {Tooltip} from '@sanity/ui'
import {isEqual} from '@sanity/util/paths'
import {
  BlockProps,
  RenderAnnotationCallback,
  RenderArrayOfObjectsItemCallback,
  RenderBlockCallback,
  RenderCustomMarkers,
  RenderFieldCallback,
  RenderInputCallback,
  RenderPreviewCallback,
} from '../../../types'
import {useFormBuilder} from '../../../useFormBuilder'
import {usePortableTextMarkers} from '../hooks/usePortableTextMarkers'
import {useMemberValidation} from '../hooks/useMemberValidation'
import {usePortableTextMemberItem} from '../hooks/usePortableTextMembers'
import {pathToString} from '../../../../field/paths'
import {EMPTY_ARRAY} from '../../../../util'
import {useChildPresence} from '../../../studio/contexts/Presence'
import {InlineObjectToolbarPopover} from './InlineObjectToolbarPopover'
import {ObjectEditModal} from './modals/ObjectEditModal'
import {PreviewSpan, Root, TooltipBox} from './InlineObject.styles'

interface InlineObjectProps {
  floatingBoundary: HTMLElement | null
  focused: boolean
  onItemClose: () => void
  onItemOpen: (path: Path) => void
  onPathFocus: (path: Path) => void
  path: Path
  readOnly?: boolean
  referenceBoundary: HTMLElement | null
  relativePath: Path
  renderAnnotation?: RenderAnnotationCallback
  renderBlock?: RenderBlockCallback
  renderCustomMarkers?: RenderCustomMarkers
  renderField: RenderFieldCallback
  renderInlineBlock?: RenderBlockCallback
  renderInput: RenderInputCallback
  renderItem: RenderArrayOfObjectsItemCallback
  renderPreview: RenderPreviewCallback
  schemaType: ObjectSchemaType
  selected: boolean
  value: PortableTextChild
}

export const InlineObject = (props: InlineObjectProps) => {
  const {
    floatingBoundary,
    focused,
    onItemClose,
    onItemOpen,
    onPathFocus,
    path,
    readOnly,
    referenceBoundary,
    relativePath,
    renderAnnotation,
    renderBlock,
    renderCustomMarkers,
    renderField,
    renderItem,
    renderInlineBlock,
    renderInput,
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
      // Take focus away from the editor so that it doesn't propagate a new focusPath and interfere here.
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

  const presence = useChildPresence(path, true)
  const rootPresence = useMemo(
    () => presence.filter((p) => isEqual(p.path, path)),
    [path, presence]
  )

  const componentProps: BlockProps = useMemo(
    () => ({
      __unstable_floatingBoundary: floatingBoundary,
      __unstable_referenceBoundary: referenceBoundary,
      __unstable_referenceElement: referenceElement as HTMLElement | null,
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
      presence: rootPresence,
      readOnly: Boolean(readOnly),
      renderAnnotation,
      renderBlock,
      renderDefault: DefaultInlineObjectComponent,
      renderField,
      renderInlineBlock,
      renderInput,
      renderItem,
      renderPreview,
      schemaType,
      selected,
      value: value as PortableTextBlock,
      validation,
    }),
    [
      floatingBoundary,
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
      readOnly,
      referenceBoundary,
      referenceElement,
      renderAnnotation,
      renderBlock,
      renderField,
      renderInlineBlock,
      renderInput,
      renderItem,
      renderPreview,
      rootPresence,
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
          {renderInlineBlock && (
            <span style={{position: 'relative'}}>{renderInlineBlock(componentProps)}</span>
          )}
        </Tooltip>
      </span>
    ),
    [componentProps, memberItem?.elementRef, renderInlineBlock, toolTipContent, tooltipEnabled]
  )
}

export const DefaultInlineObjectComponent = (props: BlockProps) => {
  const {
    __unstable_floatingBoundary: floatingBoundary,
    __unstable_referenceBoundary: referenceBoundary,
    __unstable_referenceElement: referenceElement,
    children,
    focused,
    markers,
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
      {referenceElement && (
        <InlineObjectToolbarPopover
          floatingBoundary={floatingBoundary}
          onClosePopover={onClosePopover}
          onDelete={onRemove}
          onEdit={openItem}
          open={popoverOpen}
          referenceBoundary={referenceBoundary}
          referenceElement={referenceElement}
          title={popoverTitle}
        />
      )}
      {open && (
        <ObjectEditModal
          defaultType="popover"
          onClose={onClose}
          autoFocus={focused}
          floatingBoundary={floatingBoundary}
          referenceBoundary={referenceBoundary}
          referenceElement={referenceElement}
          schemaType={schemaType}
        >
          {children}
        </ObjectEditModal>
      )}
    </>
  )
}
