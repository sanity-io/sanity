import {
  PortableTextEditor,
  PortableTextBlock,
  Type,
  RenderAttributes,
  EditorSelection,
} from '@sanity/portable-text-editor'
import {isKeySegment, Marker, Path} from '@sanity/types'
import {FOCUS_TERMINATOR, pathFor} from '@sanity/util/paths'
import {Tooltip, ResponsivePaddingProps, Flex} from '@sanity/ui'
import React, {useCallback, useMemo, useRef, useState} from 'react'
import {isEqual} from 'lodash'
import {RenderBlockActions, RenderCustomMarkers} from '../types'
import {Markers} from '../../../legacyParts'
import PatchEvent from '../../../PatchEvent'
import {BlockActions} from '../BlockActions'
import {ReviewChangesHighlightBlock, StyledChangeIndicatorForFieldPath} from '../_common'
import {createDebugStyle} from '../utils/debugRender'
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
  compareValue: undefined | PortableTextBlock
  blockRef?: React.RefObject<HTMLDivElement>
  editor: PortableTextEditor
  markers: Marker[]
  isFullscreen?: boolean
  onChange: (event: PatchEvent) => void
  onFocus: (path: Path) => void
  readOnly: boolean
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
    onChange,
    onFocus,
    readOnly,
    renderBlockActions,
    renderCustomMarkers,
    type,
    compareValue,
  } = props
  const elementRef = useRef<HTMLDivElement>()
  const [reviewChangesHovered, setReviewChangesHovered] = useState<boolean>(false)

  const handleMouseOver = useCallback(() => setReviewChangesHovered(true), [])
  const handleMouseOut = useCallback(() => setReviewChangesHovered(false), [])

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
    PortableTextEditor.delete(editor, sel, {mode: 'blocks'})
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
  const blockMarkers = useMemo(
    () =>
      markers.filter(
        (marker) => isKeySegment(marker.path[0]) && marker.path[0]._key === block._key
      ),
    [block._key, markers]
  )

  const errorMarkers = useMemo(
    () => blockMarkers.filter((marker) => marker.type === 'validation' && marker.level === 'error'),
    [blockMarkers]
  )

  const warningMarkers = useMemo(
    () =>
      blockMarkers.filter((marker) => marker.type === 'validation' && marker.level === 'warning'),
    [blockMarkers]
  )

  const infoMarkers = useMemo(
    () => blockMarkers.filter((marker) => marker.type === 'validation' && marker.level === 'info'),
    [blockMarkers]
  )

  const hasMarkers = Boolean(blockMarkers.length > 0 && renderCustomMarkers)
  const hasErrors = errorMarkers.length > 0
  const hasWarnings = warningMarkers.length > 0
  const hasInfo = infoMarkers.length > 0

  const isImagePreview = type?.type?.name === 'image'

  const changeIndicator = useMemo(() => {
    if (!isFullscreen) {
      return null
    }

    // we only want to run the deep equality check if we're in fullscreen
    const hasChanges = isFullscreen && !isEqual(compareValue, block)

    return (
      <ChangeIndicatorWrapper
        contentEditable={false}
        onMouseOver={handleMouseOver}
        onMouseLeave={handleMouseOut}
        $hasChanges={hasChanges}
      >
        <StyledChangeIndicatorForFieldPath
          isChanged={hasChanges}
          hasFocus={focused}
          path={pathFor([{_key: block._key}])}
        />
      </ChangeIndicatorWrapper>
    )
  }, [block, compareValue, focused, handleMouseOut, handleMouseOver, isFullscreen])

  const tooltipEnabled = hasErrors || hasWarnings || hasInfo || hasMarkers

  return (
    <Flex
      paddingBottom={1}
      marginY={3}
      contentEditable={false}
      ref={forwardedRef}
      style={createDebugStyle()}
    >
      <InnerFlex flex={1}>
        <PreviewContainer flex={1} {...innerPaddingProps}>
          <Tooltip
            placement="top"
            portal="editor"
            disabled={!tooltipEnabled}
            content={
              tooltipEnabled && (
                <TooltipBox padding={2}>
                  <Markers markers={markers} renderCustomMarkers={renderCustomMarkers} />
                </TooltipBox>
              )
            }
          >
            <Root
              data-focused={focused ? '' : undefined}
              data-image-preview={isImagePreview ? '' : undefined}
              data-invalid={hasErrors ? '' : undefined}
              data-markers={hasMarkers ? '' : undefined}
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

        {changeIndicator}

        {reviewChangesHovered && <ReviewChangesHighlightBlock />}
      </InnerFlex>
    </Flex>
  )
})
