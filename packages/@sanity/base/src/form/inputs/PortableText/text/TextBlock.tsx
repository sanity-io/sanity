import {PortableTextBlock, RenderAttributes} from '@sanity/portable-text-editor'
import {isKeySegment, ValidationMarker} from '@sanity/types'
import {Box, ResponsivePaddingProps, Tooltip} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'
import {NodeValidation, PortableTextMarker, RenderCustomMarkers} from '../../../types'
import {PatchArg, PatchEvent} from '../../../patch'
import {useFormBuilder} from '../../../useFormBuilder'
import {BlockActions} from '../BlockActions'
import {ReviewChangesHighlightBlock, StyledChangeIndicatorWithProvidedFullPath} from '../_common'
import {RenderBlockActionsCallback} from '../types'
import {TEXT_STYLE_PADDING} from './constants'
import {
  BlockActionsInner,
  BlockActionsOuter,
  BlockExtrasContainer,
  ChangeIndicatorWrapper,
  ListPrefixWrapper,
  TextBlockFlexWrapper,
  TextFlex,
  TextRoot,
  TooltipBox,
} from './TextBlock.styles'
import {TEXT_STYLES} from './textStyles'

export interface TextBlockProps {
  attributes: RenderAttributes
  block: PortableTextBlock
  blockRef?: React.RefObject<HTMLDivElement>
  children: React.ReactNode
  isFullscreen?: boolean
  markers: PortableTextMarker[]
  validation: NodeValidation[]
  onChange: (...patches: PatchArg[]) => void
  readOnly?: boolean
  renderBlockActions?: RenderBlockActionsCallback
  renderCustomMarkers?: RenderCustomMarkers
  spellCheck?: boolean
}

export function TextBlock(props: TextBlockProps): React.ReactElement {
  const {
    attributes,
    block,
    blockRef,
    children,
    isFullscreen,
    markers,
    validation,
    onChange,
    readOnly,
    renderBlockActions,
    renderCustomMarkers,
    spellCheck,
  } = props
  const {Markers} = useFormBuilder().__internal.components
  const [reviewChangesHovered, setReviewChangesHovered] = useState<boolean>(false)
  const [hasChanges, setHasChanges] = useState<boolean>(false)

  const {focused} = attributes

  const blockKey = block._key

  const handleMouseOver = useCallback(() => setReviewChangesHovered(true), [])
  const handleMouseOut = useCallback(() => setReviewChangesHovered(false), [])

  const handleOnHasChanges = useCallback((changed: boolean) => setHasChanges(changed), [])

  // These are custom markers that are only for this block
  const blockMarkers = useMemo(
    () =>
      markers.filter(
        (marker) =>
          marker.path.length === 1 &&
          isKeySegment(marker.path[0]) &&
          marker.path[0]._key === blockKey
      ),

    [blockKey, markers]
  )

  // These are validation markers that are only for the block level (things further up, like
  // annotations and inline objects are dealt with in their respective components)
  const blockValidation = useMemo(
    () =>
      validation.filter(
        (marker) =>
          marker.path.length === 1 &&
          isKeySegment(marker.path[0]) &&
          marker.path[0]._key === blockKey
      ),

    [blockKey, validation]
  )

  const errorMessages = useMemo(
    () => blockValidation.filter((marker) => marker.level === 'error'),
    [blockValidation]
  )

  const warningMessages = useMemo(
    () => blockValidation.filter((marker) => marker.level === 'warning'),
    [blockValidation]
  )

  // const hasCustomMarkers =
  //   Boolean(renderCustomMarkers) && blockValidation.filter((m) => !isValidationMarker(m)).length > 0
  const hasMarkers = markers.length > 0
  const hasErrors = errorMessages.length > 0
  const hasWarnings = warningMessages.length > 0

  const tooltipEnabled = hasErrors || hasWarnings || hasMarkers

  const blockPath = useMemo(() => [{_key: blockKey}], [blockKey])

  const text = useMemo(() => {
    const TextStyle = TEXT_STYLES[block.style] || TEXT_STYLES.normal

    return (
      <TextFlex align="flex-start" $level={block?.level}>
        {block.listItem && (
          <ListPrefixWrapper contentEditable={false}>
            <TextStyle data-list-prefix="" />
          </ListPrefixWrapper>
        )}

        <TextStyle data-text="">{children}</TextStyle>
      </TextFlex>
    )
  }, [block.style, block.listItem, block.level, children])

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

  const outerPaddingProps: ResponsivePaddingProps = useMemo(() => {
    if (block.listItem) {
      return {paddingY: 2}
    }

    return TEXT_STYLE_PADDING[block.style] || {paddingY: 2}
  }, [block])

  return (
    <Box data-testid="text-block" {...outerPaddingProps}>
      <TextBlockFlexWrapper data-testid="text-block__wrapper">
        <Box flex={1} {...innerPaddingProps}>
          <Tooltip
            placement="top"
            boundaryElement={blockRef?.current}
            portal="editor"
            disabled={!tooltipEnabled}
            content={
              tooltipEnabled && (
                <TooltipBox padding={2}>
                  <Markers
                    markers={blockMarkers}
                    validation={blockValidation}
                    renderCustomMarkers={renderCustomMarkers}
                  />
                </TooltipBox>
              )
            }
          >
            <TextRoot
              $level={block.level}
              data-error={hasErrors ? '' : undefined}
              data-warning={hasWarnings ? '' : undefined}
              data-list-item={block.listItem}
              // @todo: rename to `data-markers`
              data-custom-markers={hasMarkers ? '' : undefined}
              data-testid="text-block__text"
              spellCheck={spellCheck}
              ref={blockRef}
            >
              {text}
            </TextRoot>
          </Tooltip>
        </Box>
        <BlockExtrasContainer contentEditable={false}>
          {renderBlockActions && (
            <BlockActionsOuter marginRight={1}>
              <BlockActionsInner>
                {focused && !readOnly && (
                  <BlockActions
                    onChange={onChange}
                    block={block}
                    renderBlockActions={renderBlockActions}
                  />
                )}
              </BlockActionsInner>
            </BlockActionsOuter>
          )}

          {isFullscreen && (
            <ChangeIndicatorWrapper
              onMouseOver={handleMouseOver}
              onMouseOut={handleMouseOut}
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
        </BlockExtrasContainer>

        {reviewChangesHovered && <ReviewChangesHighlightBlock />}
      </TextBlockFlexWrapper>
    </Box>
  )
}
