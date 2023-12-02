/* eslint-disable complexity */
import {
  PortableTextEditor,
  EditorSelection,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import {ObjectSchemaType, Path, PortableTextBlock, isImage} from '@sanity/types'
import {Box, Flex, ResponsivePaddingProps} from '@sanity/ui'
import React, {PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {isEqual} from '@sanity/util/paths'
import {TooltipWithNodes} from '../../../../../ui'
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
import {RenderBlockActionsCallback} from '../../../types/_transitional'
import {BlockActions} from '../BlockActions'
import {ReviewChangesHighlightBlock, StyledChangeIndicatorWithProvidedFullPath} from '../_common'
import {useFormBuilder} from '../../../useFormBuilder'
import {useMemberValidation} from '../hooks/useMemberValidation'
import {usePortableTextMarkers} from '../hooks/usePortableTextMarkers'
import {usePortableTextMemberItem} from '../hooks/usePortableTextMembers'
import {pathToString} from '../../../../field'
import {debugRender} from '../debugRender'
import {EMPTY_ARRAY} from '../../../../util'
import {useChildPresence} from '../../../studio/contexts/Presence'
import {useFormCallbacks} from '../../../studio'
import {
  Root,
  ChangeIndicatorWrapper,
  InnerFlex,
  BlockActionsOuter,
  BlockActionsInner,
  TooltipBox,
  PreviewContainer,
} from './BlockObject.styles'
import {BlockObjectActionsMenu} from './BlockObjectActionsMenu'
import {ObjectEditModal} from './modals/ObjectEditModal'

interface BlockObjectProps extends PropsWithChildren {
  floatingBoundary: HTMLElement | null
  focused: boolean
  isActive?: boolean
  isFullscreen?: boolean
  onItemClose: () => void
  onItemOpen: (path: Path) => void
  onItemRemove: (itemKey: string) => void
  onPathFocus: (path: Path) => void
  path: Path
  readOnly?: boolean
  referenceBoundary: HTMLElement | null
  relativePath: Path
  renderAnnotation?: RenderAnnotationCallback
  renderBlock?: RenderBlockCallback
  renderBlockActions?: RenderBlockActionsCallback
  renderCustomMarkers?: RenderCustomMarkers
  renderField: RenderFieldCallback
  renderInlineBlock?: RenderBlockCallback
  renderInput: RenderInputCallback
  renderItem: RenderArrayOfObjectsItemCallback
  renderPreview: RenderPreviewCallback
  schemaType: ObjectSchemaType
  selected: boolean
  value: PortableTextBlock
}

export function BlockObject(props: BlockObjectProps) {
  const {
    floatingBoundary,
    focused,
    isFullscreen,
    onItemClose,
    onItemOpen,
    onPathFocus,
    path,
    readOnly,
    referenceBoundary,
    relativePath,
    renderAnnotation,
    renderBlock,
    renderBlockActions,
    renderCustomMarkers,
    renderField,
    renderInlineBlock,
    renderInput,
    renderItem,
    renderPreview,
    schemaType,
    selected,
    value,
  } = props
  const {onChange} = useFormCallbacks()
  const {Markers} = useFormBuilder().__internal.components
  const [reviewChangesHovered, setReviewChangesHovered] = useState<boolean>(false)
  const markers = usePortableTextMarkers(path)
  const editor = usePortableTextEditor()
  const memberItem = usePortableTextMemberItem(pathToString(path))
  const isDeleting = useRef<boolean>(false)

  const selfSelection = useMemo(
    (): EditorSelection => ({
      anchor: {path: relativePath, offset: 0},
      focus: {path: relativePath, offset: 0},
    }),
    [relativePath],
  )

  const handleMouseOver = useCallback(() => setReviewChangesHovered(true), [])
  const handleMouseOut = useCallback(() => setReviewChangesHovered(false), [])

  const onOpen = useCallback(() => {
    if (memberItem) {
      // Take focus away from the editor so that it doesn't propagate a new focusPath and interfere here.
      PortableTextEditor.blur(editor)
      onItemOpen(memberItem.node.path)
    }
  }, [editor, memberItem, onItemOpen])

  const onClose = useCallback(() => {
    onItemClose()
    PortableTextEditor.select(editor, selfSelection)
    PortableTextEditor.focus(editor)
  }, [onItemClose, editor, selfSelection])

  const onRemove = useCallback(() => {
    // Guard against clicking "Delete" multiple times.
    if (isDeleting.current) {
      return
    }
    try {
      PortableTextEditor.delete(editor, selfSelection, {mode: 'blocks'})
    } catch (err) {
      console.error(err)
    } finally {
      isDeleting.current = true
    }
  }, [editor, selfSelection])

  // Focus the editor if this object is removed because it was deleted.
  // This is some special code needed for how the Menu for the block object
  // is taking focus while clicking "Delete" from the menu.
  useEffect(
    () => () => {
      if (isDeleting.current) {
        PortableTextEditor.focus(editor)
      }
    },
    [editor],
  )

  const innerPaddingProps: ResponsivePaddingProps = useMemo(() => {
    if (isFullscreen && !renderBlockActions) {
      return {paddingX: 5}
    }

    if (isFullscreen && renderBlockActions) {
      return {paddingLeft: 5, paddingRight: 2}
    }

    if (renderBlockActions) {
      return {
        paddingLeft: 3,
        paddingRight: 2,
      }
    }

    return {paddingX: 3}
  }, [isFullscreen, renderBlockActions])

  const {validation, hasError, hasWarning, hasInfo} = useMemberValidation(memberItem?.node)
  const parentSchemaType = editor.schemaTypes.portableText
  const hasMarkers = Boolean(markers.length > 0)

  const presence = useChildPresence(path, true)
  const rootPresence = useMemo(
    () => presence.filter((p) => isEqual(p.path, path)),
    [path, presence],
  )

  // Tooltip indicating validation errors, warnings, info and markers
  const tooltipEnabled = hasError || hasWarning || hasInfo || hasMarkers
  const toolTipContent = useMemo(
    () =>
      (tooltipEnabled && (
        <TooltipBox>
          <Markers
            markers={markers}
            validation={validation}
            renderCustomMarkers={renderCustomMarkers}
          />
        </TooltipBox>
      )) ||
      null,
    [Markers, markers, renderCustomMarkers, tooltipEnabled, validation],
  )

  const isOpen = Boolean(memberItem?.member.open)
  const input = memberItem?.input
  const nodePath = memberItem?.node.path || EMPTY_ARRAY
  const referenceElement = memberItem?.elementRef?.current

  const componentProps: BlockProps = useMemo(
    () => ({
      __unstable_floatingBoundary: floatingBoundary,
      __unstable_referenceBoundary: referenceBoundary,
      __unstable_referenceElement: (referenceElement || null) as HTMLElement | null,
      children: input,
      focused,
      markers,
      onClose,
      onOpen,
      onPathFocus,
      onRemove,
      open: isOpen,
      parentSchemaType,
      path: nodePath,
      presence: rootPresence,
      readOnly: Boolean(readOnly),
      renderAnnotation,
      renderBlock,
      renderDefault: DefaultBlockObjectComponent,
      renderField,
      renderInlineBlock,
      renderInput,
      renderItem,
      renderPreview,
      schemaType,
      selected,
      validation,
      value,
    }),
    [
      floatingBoundary,
      referenceElement,
      input,
      focused,
      markers,
      onClose,
      onOpen,
      onPathFocus,
      onRemove,
      isOpen,
      parentSchemaType,
      nodePath,
      rootPresence,
      readOnly,
      referenceBoundary,
      renderAnnotation,
      renderBlock,
      renderField,
      renderInlineBlock,
      renderInput,
      renderItem,
      renderPreview,
      schemaType,
      selected,
      validation,
      value,
    ],
  )

  return useMemo(
    () => (
      <Box
        ref={memberItem?.elementRef as React.RefObject<HTMLDivElement> | undefined}
        contentEditable={false}
      >
        <Flex paddingBottom={1} marginY={3} style={debugRender()}>
          <InnerFlex flex={1}>
            <TooltipWithNodes
              placement="top"
              portal="editor"
              disabled={!tooltipEnabled}
              content={toolTipContent}
            >
              <PreviewContainer {...innerPaddingProps}>
                {renderBlock && renderBlock(componentProps)}
              </PreviewContainer>
            </TooltipWithNodes>
            <BlockActionsOuter marginRight={1}>
              <BlockActionsInner>
                {renderBlockActions && value && focused && !readOnly && (
                  <BlockActions
                    block={value}
                    onChange={onChange}
                    renderBlockActions={renderBlockActions}
                  />
                )}
              </BlockActionsInner>
            </BlockActionsOuter>

            {isFullscreen && memberItem && (
              <ChangeIndicatorWrapper
                $hasChanges={memberItem.member.item.changed}
                onMouseOut={handleMouseOut}
                onMouseOver={handleMouseOver}
              >
                <StyledChangeIndicatorWithProvidedFullPath
                  hasFocus={focused}
                  isChanged={memberItem.member.item.changed}
                  path={memberItem.member.item.path}
                  withHoverEffect={false}
                />
              </ChangeIndicatorWrapper>
            )}

            {reviewChangesHovered && <ReviewChangesHighlightBlock />}
          </InnerFlex>
        </Flex>
      </Box>
    ),
    [
      componentProps,
      focused,
      handleMouseOut,
      handleMouseOver,
      innerPaddingProps,
      isFullscreen,
      memberItem,
      onChange,
      readOnly,
      renderBlock,
      renderBlockActions,
      reviewChangesHovered,
      toolTipContent,
      tooltipEnabled,
      value,
    ],
  )
}

export const DefaultBlockObjectComponent = (props: BlockProps) => {
  const {
    __unstable_floatingBoundary,
    __unstable_referenceBoundary,
    __unstable_referenceElement,
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
    value,
    validation,
  } = props

  const isImagePreview = isImage(value)
  const hasError = validation.filter((v) => v.level === 'error').length > 0
  const hasWarning = validation.filter((v) => v.level === 'warning').length > 0
  const hasMarkers = Boolean(markers.length > 0)
  const tone = selected || focused ? 'primary' : 'default'

  const handleDoubleClickToOpen = useCallback(
    (e: React.MouseEvent<Element, MouseEvent>) => {
      e.preventDefault()
      e.stopPropagation()
      onOpen()
    },
    [onOpen],
  )

  return (
    <>
      <Root
        data-focused={focused ? '' : undefined}
        data-image-preview={isImagePreview ? '' : undefined}
        data-invalid={hasError ? '' : undefined}
        data-markers={hasMarkers ? '' : undefined}
        data-read-only={readOnly ? '' : undefined}
        data-selected={selected ? '' : undefined}
        data-testid="pte-block-object"
        data-warning={hasWarning ? '' : undefined}
        flex={1}
        onDoubleClick={handleDoubleClickToOpen}
        padding={isImagePreview ? 0 : 1}
        tone={tone}
      >
        {renderPreview({
          actions: (
            <BlockObjectActionsMenu
              isOpen={open}
              focused={focused}
              onOpen={onOpen}
              onRemove={onRemove}
              readOnly={readOnly}
              value={value}
            />
          ),
          layout: isImagePreview ? 'blockImage' : 'block',
          schemaType,
          skipVisibilityCheck: true,
          value,
        })}
      </Root>
      {open && (
        <ObjectEditModal
          floatingBoundary={__unstable_floatingBoundary}
          defaultType="dialog"
          onClose={onClose}
          autoFocus={focused}
          schemaType={schemaType}
          referenceBoundary={__unstable_referenceBoundary}
          referenceElement={__unstable_referenceElement}
        >
          {children}
        </ObjectEditModal>
      )}
    </>
  )
}
