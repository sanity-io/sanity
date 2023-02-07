import {
  PortableTextEditor,
  EditorSelection,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import {ObjectSchemaType, Path, PortableTextBlock} from '@sanity/types'
import {Tooltip, Flex, ResponsivePaddingProps} from '@sanity/ui'
import React, {ComponentType, useCallback, useMemo, useRef, useState} from 'react'
import {PatchArg} from '../../../patch'
import {BlockProps, RenderCustomMarkers, RenderPreviewCallback} from '../../../types'
import {RenderBlockActionsCallback} from '../types'
import {BlockActions} from '../BlockActions'
import {ReviewChangesHighlightBlock, StyledChangeIndicatorWithProvidedFullPath} from '../_common'
import {useFormBuilder} from '../../../useFormBuilder'
import {useMemberValidation} from '../hooks/useMemberValidation'
import {usePortableTextMarkers} from '../hooks/usePortableTextMarkers'
import {usePortableTextMemberItem} from '../hooks/usePortableTextMembers'
import {pathToString} from '../../../../field'
import {debugRender} from '../debugRender'
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
  block: PortableTextBlock
  focused: boolean
  isActive?: boolean
  isFullscreen?: boolean
  onChange: (...patches: PatchArg[]) => void
  onItemOpen: (path: Path) => void
  onItemClose: () => void
  onItemRemove: (itemKey: string) => void
  path: Path
  readOnly?: boolean
  renderBlockActions?: RenderBlockActionsCallback
  renderCustomMarkers?: RenderCustomMarkers
  renderPreview: RenderPreviewCallback
  selected: boolean
  type: ObjectSchemaType
}

export function BlockObject(props: BlockObjectProps) {
  const {
    block,
    focused,
    isActive,
    isFullscreen,
    onChange,
    onItemOpen,
    onItemClose,
    path,
    readOnly,
    renderBlockActions,
    renderCustomMarkers,
    renderPreview,
    selected,
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

  const openItem = useCallback(() => {
    if (memberItem) {
      onItemOpen(memberItem.node.path)
    }
  }, [onItemOpen, memberItem])

  const handleDoubleClickToOpen = useCallback(
    (e: React.MouseEvent<Element, MouseEvent>) => {
      e.preventDefault()
      e.stopPropagation()
      PortableTextEditor.blur(editor)
      openItem()
    },
    [editor, openItem]
  )

  const onRemove = useCallback(() => {
    const sel: EditorSelection = {focus: {path, offset: 0}, anchor: {path, offset: 0}}
    PortableTextEditor.delete(editor, sel, {mode: 'blocks'})
    // Focus will not stick unless this is done through a timeout when deleted through clicking the menu button.
    setTimeout(() => PortableTextEditor.focus(editor))
  }, [editor, path])

  const handleDelete = useCallback(
    (e: React.MouseEvent<Element, MouseEvent>) => {
      e.preventDefault()
      e.stopPropagation()
      onRemove()
    },
    [onRemove]
  )

  const isOpen = !!memberItem?.member.open

  const blockPreview = useMemo(() => {
    return (
      <BlockObjectPreview
        focused={focused}
        isActive={isActive}
        onClickingDelete={handleDelete}
        onClickingEdit={openItem}
        readOnly={readOnly}
        renderPreview={renderPreview}
        isOpen={isOpen}
        type={type}
        value={block}
      />
    )
  }, [focused, isActive, handleDelete, openItem, readOnly, renderPreview, isOpen, type, block])

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

  const tooltipEnabled = hasError || hasWarning || hasInfo || hasMarkers
  const toolTipContent = useMemo(
    () =>
      (tooltipEnabled && (validation.length > 0 || markers.length > 0) && (
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

  const defaultRendered = useMemo(
    () => (
      <Flex paddingBottom={1} marginY={3} contentEditable={false} style={debugRender()}>
        <InnerFlex flex={1}>
          <PreviewContainer flex={1} {...innerPaddingProps}>
            <Tooltip
              placement="top"
              portal="editor"
              disabled={!tooltipEnabled}
              content={toolTipContent}
            >
              <Root
                data-focused={focused ? '' : undefined}
                data-image-preview={isImagePreview ? '' : undefined}
                data-invalid={hasError ? '' : undefined}
                data-markers={hasMarkers && renderCustomMarkers ? '' : undefined}
                data-read-only={readOnly ? '' : undefined}
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
    ),
    [
      block,
      blockPreview,
      focused,
      handleDoubleClickToOpen,
      handleMouseOut,
      handleMouseOver,
      hasError,
      hasMarkers,
      hasWarning,
      innerPaddingProps,
      isFullscreen,
      isImagePreview,
      memberItem,
      onChange,
      readOnly,
      renderBlockActions,
      renderCustomMarkers,
      reviewChangesHovered,
      selected,
      tone,
      toolTipContent,
      tooltipEnabled,
    ]
  )

  const CustomComponent = type.components?.block as ComponentType<BlockProps>

  const renderDefault = useCallback(() => defaultRendered, [defaultRendered])

  return CustomComponent ? (
    <CustomComponent
      focused={focused}
      open={memberItem?.member.open || false}
      onOpen={openItem}
      onClose={onItemClose}
      onRemove={onRemove}
      path={memberItem?.node.path || path}
      selected={selected}
      value={block}
      renderDefault={renderDefault}
    >
      <BlockPreview ref={memberItem?.elementRef as React.RefObject<HTMLDivElement>}>
        {blockPreview}
      </BlockPreview>
    </CustomComponent>
  ) : (
    defaultRendered
  )
}
