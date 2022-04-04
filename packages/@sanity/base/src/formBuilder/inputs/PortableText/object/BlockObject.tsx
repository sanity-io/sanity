import {
  PortableTextEditor,
  PortableTextBlock,
  Type,
  RenderAttributes,
  EditorSelection,
} from '@sanity/portable-text-editor'
import {
  isKeySegment,
  ValidationMarker,
  Path,
  isValidationErrorMarker,
  isValidationWarningMarker,
  isValidationInfoMarker,
} from '@sanity/types'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import {Tooltip, Flex, ResponsivePaddingProps} from '@sanity/ui'
import React, {useCallback, useMemo, useRef, useState} from 'react'
import {PatchEvent, PortableTextMarker, RenderCustomMarkers} from '../../../../form'
import {RenderBlockActions} from '../types'
import {BlockActions} from '../BlockActions'
import {ReviewChangesHighlightBlock, StyledChangeIndicatorWithProvidedFullPath} from '../_common'
import {useFormBuilder} from '../../../useFormBuilder'
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
  blockRef?: React.RefObject<HTMLDivElement>
  editor: PortableTextEditor
  markers: PortableTextMarker[]
  validation: ValidationMarker[]
  isFullscreen?: boolean
  onChange: (event: PatchEvent) => void
  onFocus: (path: Path) => void
  readOnly?: boolean
  renderBlockActions?: RenderBlockActions
  renderCustomMarkers?: RenderCustomMarkers
  type: Type
}

export const BlockObject = React.forwardRef(function BlockObject(
  props: BlockObjectProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>
) {
  const {
    attributes: {focused, selected, path},
    block,
    blockRef,
    editor,
    isFullscreen,
    markers,
    validation,
    onChange,
    onFocus,
    readOnly,
    renderBlockActions,
    renderCustomMarkers,
    type,
  } = props
  const {Markers} = useFormBuilder().components
  const elementRef = useRef<HTMLDivElement | null>(null)
  const [reviewChangesHovered, setReviewChangesHovered] = useState<boolean>(false)
  const [hasChanges, setHasChanges] = useState<boolean>(false)

  const handleMouseOver = useCallback(() => setReviewChangesHovered(true), [])
  const handleMouseOut = useCallback(() => setReviewChangesHovered(false), [])

  const handleOnHasChanges = useCallback((changed: boolean) => setHasChanges(changed), [])

  const handleEdit = useCallback(() => {
    onFocus(path.concat(FOCUS_TERMINATOR))
  }, [onFocus, path])

  const handleDoubleClickToOpen = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      PortableTextEditor.blur(editor)
      handleEdit()
    },
    [editor, handleEdit]
  )

  const handleDelete = useCallback(() => {
    const sel: EditorSelection = {focus: {path, offset: 0}, anchor: {path, offset: 0}}
    PortableTextEditor.delete(editor, sel, {mode: 'block'})
    // The focus seems to get stuck somehow on the dropdown menu.
    // Setting focus like this seems to avoid that.
    setTimeout(() => PortableTextEditor.focus(editor))
  }, [editor, path])

  const blockPreview = useMemo(() => {
    return (
      <BlockObjectPreview
        type={type}
        focused={focused}
        value={block}
        readOnly={readOnly}
        onClickingDelete={handleDelete}
        onClickingEdit={handleEdit}
      />
    )
  }, [focused, type, block, readOnly, handleDelete, handleEdit])

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

  // These are marker that is only for the block level (things further up, like annotations and inline objects are dealt with in their respective components)
  const blockValidationMarkers = useMemo(
    () =>
      validation.filter(
        (marker) => isKeySegment(marker.path[0]) && marker.path[0]._key === block._key
      ),

    [block._key, validation]
  )

  const hasMarkers = Boolean(blockValidationMarkers.length > 0)
  const hasErrors = blockValidationMarkers.some(isValidationErrorMarker)
  const hasWarnings = blockValidationMarkers.some(isValidationWarningMarker)
  const hasInfo = blockValidationMarkers.some(isValidationInfoMarker)

  const isImagePreview = type?.type?.name === 'image'

  const blockPath = useMemo(() => [{_key: block._key}], [block._key])

  const tooltipEnabled = hasErrors || hasWarnings || hasInfo || (hasMarkers && renderCustomMarkers)

  return (
    <Flex paddingBottom={1} marginY={3} contentEditable={false} ref={forwardedRef}>
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
              data-invalid={hasErrors ? '' : undefined}
              data-markers={hasMarkers && renderCustomMarkers ? '' : undefined}
              data-selected={selected ? '' : undefined}
              data-testid="pte-block-object"
              data-warning={hasWarnings ? '' : undefined}
              flex={1}
              onDoubleClick={handleDoubleClickToOpen}
              padding={isImagePreview ? 0 : 1}
              ref={elementRef}
              tone={tone}
            >
              <BlockPreview ref={blockRef}>{blockPreview}</BlockPreview>
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

        {isFullscreen && (
          <ChangeIndicatorWrapper
            contentEditable={false}
            onMouseOver={handleMouseOver}
            onMouseLeave={handleMouseOut}
            $hasChanges={Boolean(hasChanges)}
          >
            <StyledChangeIndicatorWithProvidedFullPath
              compareDeep
              value={block}
              hasFocus={focused}
              path={blockPath}
              withHoverEffect={false}
              onHasChanges={handleOnHasChanges}
            />
          </ChangeIndicatorWrapper>
        )}

        {reviewChangesHovered && <ReviewChangesHighlightBlock />}
      </InnerFlex>
    </Flex>
  )
})
