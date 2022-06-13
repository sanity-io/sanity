import {
  PortableTextEditor,
  PortableTextBlock,
  RenderAttributes,
  EditorSelection,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import {ObjectSchemaType, Path} from '@sanity/types'
import {Tooltip, Flex, ResponsivePaddingProps} from '@sanity/ui'
import React, {useCallback, useMemo, useRef, useState} from 'react'
import {PatchArg} from '../../../patch'
import {RenderCustomMarkers, RenderPreviewCallback} from '../../../types'
import {RenderBlockActionsCallback} from '../types'
import {BlockActions} from '../BlockActions'
import {ReviewChangesHighlightBlock, StyledChangeIndicatorWithProvidedFullPath} from '../_common'
import {useFormBuilder} from '../../../useFormBuilder'
import {useMemberValidation} from '../hooks/useMemberValidation'
import {usePortableTextMarkers} from '../hooks/usePortableTextMarkers'
import {usePortableTextMemberItem} from '../hooks/usePortableTextMembers'
import {pathToString} from '../../../../field/paths'
import {BlockObjectPreview} from './BlockObjectPreview'
import {
  Root,
  PreviewContainer,
  ChangeIndicatorWrapper,
  InnerFlex,
  BlockActionsOuter,
  BlockActionsInner,
  TooltipBox,
  BlockPreview,
} from './BlockObject.styles'

interface BlockObjectProps {
  attributes: RenderAttributes
  block: PortableTextBlock
  isFullscreen?: boolean
  onChange: (...patches: PatchArg[]) => void
  onOpenItem: (path: Path) => void
  readOnly?: boolean
  renderBlockActions?: RenderBlockActionsCallback
  renderCustomMarkers?: RenderCustomMarkers
  renderPreview: RenderPreviewCallback
  type: ObjectSchemaType
}

export function BlockObject(props: BlockObjectProps) {
  const {
    attributes: {focused, selected, path},
    block,
    isFullscreen,
    onChange,
    onOpenItem,
    readOnly,
    renderBlockActions,
    renderCustomMarkers,
    renderPreview,
    type,
  } = props
  const {Markers} = useFormBuilder().__internal.components
  const elementRef = useRef<HTMLDivElement | null>(null)
  const [reviewChangesHovered, setReviewChangesHovered] = useState<boolean>(false)
  const markers = usePortableTextMarkers(path)
  const editor = usePortableTextEditor()
  const memberItem = usePortableTextMemberItem(pathToString(path))

  const handleMouseOver = useCallback(() => setReviewChangesHovered(true), [])
  const handleMouseOut = useCallback(() => setReviewChangesHovered(false), [])

  const handleEdit = useCallback(() => {
    if (memberItem) {
      onOpenItem(memberItem.node.path)
    }
  }, [onOpenItem, memberItem])

  const handleDoubleClickToOpen = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      PortableTextEditor.blur(editor)
      handleEdit()
    },
    [editor, handleEdit]
  )

  const handleDelete = useCallback(
    (e) => {
      e.stopPropagation()
      e.preventDefault()
      const sel: EditorSelection = {focus: {path, offset: 0}, anchor: {path, offset: 0}}
      PortableTextEditor.delete(editor, sel, {mode: 'blocks'})
      // Focus will not stick unless this is done through a timeout when deleted through clicking the menu button.
      setTimeout(() => PortableTextEditor.focus(editor))
    },
    [editor, path]
  )

  const blockPreview = useMemo(() => {
    return (
      <BlockObjectPreview
        type={type}
        focused={focused}
        value={block}
        readOnly={readOnly}
        onClickingDelete={handleDelete}
        onClickingEdit={handleEdit}
        renderPreview={renderPreview}
      />
    )
  }, [focused, type, block, readOnly, handleDelete, handleEdit, renderPreview])

  const tone = selected || focused ? 'primary' : 'default'

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

  const hasMarkers = Boolean(markers.length > 0)

  const isImagePreview = memberItem?.node.schemaType.name === 'image'

  const tooltipEnabled = hasError || hasWarning || hasInfo || (hasMarkers && renderCustomMarkers)

  return (
    <Flex paddingBottom={1} marginY={3} contentEditable={false}>
      <InnerFlex flex={1}>
        <PreviewContainer flex={1} {...innerPaddingProps}>
          <Tooltip
            placement="top"
            portal="editor"
            disabled={!tooltipEnabled}
            content={
              tooltipEnabled && (
                <TooltipBox padding={2}>
                  <Markers
                    markers={markers}
                    validation={validation}
                    renderCustomMarkers={renderCustomMarkers}
                  />
                </TooltipBox>
              )
            }
          >
            <Root
              data-focused={focused ? '' : undefined}
              data-image-preview={isImagePreview ? '' : undefined}
              data-invalid={hasError ? '' : undefined}
              data-markers={hasMarkers && renderCustomMarkers ? '' : undefined}
              data-selected={selected ? '' : undefined}
              data-testid="pte-block-object"
              data-warning={hasWarning ? '' : undefined}
              flex={1}
              onDoubleClick={handleDoubleClickToOpen}
              padding={isImagePreview ? 0 : 1}
              ref={elementRef}
              tone={tone}
            >
              <BlockPreview ref={memberItem?.elementRef as React.RefObject<HTMLDivElement>}>
                {blockPreview}
              </BlockPreview>
            </Root>
          </Tooltip>
        </PreviewContainer>

        <BlockActionsOuter marginRight={1}>
          <BlockActionsInner>
            {renderBlockActions && block && focused && !readOnly && (
              <BlockActions
                onChange={onChange}
                block={block}
                renderBlockActions={renderBlockActions}
              />
            )}
          </BlockActionsInner>
        </BlockActionsOuter>

        {isFullscreen && memberItem && (
          <ChangeIndicatorWrapper
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}
            $hasChanges={memberItem.member.item.changed}
          >
            <StyledChangeIndicatorWithProvidedFullPath
              withHoverEffect={false}
              hasFocus={focused}
              path={memberItem.member.item.path}
              isChanged={memberItem.member.item.changed}
            />
          </ChangeIndicatorWrapper>
        )}

        {reviewChangesHovered && <ReviewChangesHighlightBlock />}
      </InnerFlex>
    </Flex>
  )
}
