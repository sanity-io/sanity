import {PortableTextBlock, RenderAttributes} from '@sanity/portable-text-editor'
import {isKeySegment, isValidationMarker, Marker} from '@sanity/types'
import {Box, ResponsivePaddingProps, Tooltip} from '@sanity/ui'
import React, {useMemo} from 'react'
import {Markers} from '../../../legacyParts'
import PatchEvent from '../../../PatchEvent'
import {BlockActions} from '../BlockActions'
import {RenderBlockActions, RenderCustomMarkers} from '../types'
import {TEXT_STYLE_PADDING} from './constants'
import {
  BlockActionsInner,
  BlockActionsOuter,
  ChangeIndicatorWrapper,
  ListPrefixWrapper,
  StyledChangeIndicatorWithProvidedFullPath,
  TextBlockFlexWrapper,
  TextFlex,
  TextRoot,
  TooltipBox,
} from './TextBlock.styles'
import {TEXT_STYLES} from './textStyles'

interface TextBlockProps {
  attributes: RenderAttributes
  block: PortableTextBlock
  blockRef?: React.RefObject<HTMLDivElement>
  children: React.ReactNode
  isFullscreen?: boolean
  markers: Marker[]
  onChange: (event: PatchEvent) => void
  readOnly: boolean
  renderBlockActions?: RenderBlockActions
  renderCustomMarkers?: RenderCustomMarkers
}

export function TextBlock(props: TextBlockProps): React.ReactElement {
  const {
    attributes,
    block,
    blockRef,
    children,
    isFullscreen,
    markers,
    onChange,
    readOnly,
    renderBlockActions,
    renderCustomMarkers,
  } = props

  const {focused} = attributes

  const blockKey = block._key

  // These are marker that is only for the block level (things further up, like annotations and inline objects are dealt with in their respective components)
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

  const errorMarkers = useMemo(
    () => blockMarkers.filter((marker) => isValidationMarker(marker) && marker.level === 'error'),
    [blockMarkers]
  )

  const warningMarkers = useMemo(
    () => blockMarkers.filter((marker) => isValidationMarker(marker) && marker.level === 'warning'),
    [blockMarkers]
  )

  const hasCustomMarkers =
    Boolean(renderCustomMarkers) && blockMarkers.filter((m) => !isValidationMarker(m)).length > 0
  const hasErrors = errorMarkers.length > 0
  const hasWarnings = warningMarkers.length > 0

  const tooltipEnabled = hasErrors || hasWarnings || hasCustomMarkers

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
                  <Markers markers={blockMarkers} renderCustomMarkers={renderCustomMarkers} />
                </TooltipBox>
              )
            }
          >
            <TextRoot
              $level={block.level}
              data-error={hasErrors ? '' : undefined}
              data-warning={hasWarnings ? '' : undefined}
              data-list-item={block.listItem}
              data-custom-markers={hasCustomMarkers ? '' : undefined}
              data-testid="text-block__text"
              ref={blockRef}
            >
              {text}
            </TextRoot>
          </Tooltip>
        </Box>

        <div
          contentEditable={false}
          // NOTE: it’s important that this element does not have the `user-select: none` CSS
          // property, because that will not work in Safari (breaks `Cmd+A`).
          // It seems Safari does not allow defining `user-select` on an element which also has
          // the `contenteditable="false"` attribute.
        >
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
            <ChangeIndicatorWrapper>
              <StyledChangeIndicatorWithProvidedFullPath
                compareDeep
                value={block}
                hasFocus={focused}
                path={blockPath}
              />
            </ChangeIndicatorWrapper>
          )}
        </div>
      </TextBlockFlexWrapper>
    </Box>
  )
}
