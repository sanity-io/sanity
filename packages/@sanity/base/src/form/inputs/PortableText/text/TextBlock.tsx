import {PortableTextBlock, RenderAttributes} from '@sanity/portable-text-editor'
import {Box, ResponsivePaddingProps, Tooltip} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'
import {RenderCustomMarkers} from '../../../types'
import {PatchArg} from '../../../patch'
import {useFormBuilder} from '../../../useFormBuilder'
import {BlockActions} from '../BlockActions'
import {ReviewChangesHighlightBlock, StyledChangeIndicatorWithProvidedFullPath} from '../_common'
import {RenderBlockActionsCallback} from '../types'
import {useMemberValidation} from '../hooks/useMemberValidation'
import {usePortableTextMarkers} from '../hooks/usePortableTextMarkers'
import {usePortableTextMemberItem} from '../hooks/usePortableTextMembers'
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
  children: React.ReactNode
  isFullscreen?: boolean
  onChange: (...patches: PatchArg[]) => void
  readOnly?: boolean
  renderBlockActions?: RenderBlockActionsCallback
  renderCustomMarkers?: RenderCustomMarkers
  spellCheck?: boolean
}

export const TextBlock = React.forwardRef(function TextBlock(
  props: TextBlockProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>
) {
  const {
    attributes: {path, focused},
    block,
    children,
    isFullscreen,
    onChange,
    readOnly,
    renderBlockActions,
    renderCustomMarkers,
    spellCheck,
  } = props
  const {Markers} = useFormBuilder().__internal.components
  const [reviewChangesHovered, setReviewChangesHovered] = useState<boolean>(false)
  const [hasChanges, setHasChanges] = useState<boolean>(false)
  const markers = usePortableTextMarkers(path)
  const member = usePortableTextMemberItem(JSON.stringify(path))

  const blockKey = block._key

  const handleMouseOver = useCallback(() => setReviewChangesHovered(true), [])
  const handleMouseOut = useCallback(() => setReviewChangesHovered(false), [])

  const handleOnHasChanges = useCallback((changed: boolean) => setHasChanges(changed), [])

  const {memberValidation, hasError, hasWarning, hasInfo} = useMemberValidation(member?.member)

  const hasMarkers = Boolean(renderCustomMarkers) && markers.length > 0

  const tooltipEnabled = hasError || hasWarning || hasMarkers || hasInfo

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

  let boundaryElement: HTMLDivElement | undefined
  if (forwardedRef && 'current' in forwardedRef) {
    boundaryElement = forwardedRef.current || undefined
  }

  return (
    <Box data-testid="text-block" {...outerPaddingProps}>
      <TextBlockFlexWrapper data-testid="text-block__wrapper">
        <Box flex={1} {...innerPaddingProps}>
          <Tooltip
            placement="top"
            boundaryElement={boundaryElement}
            portal="editor"
            disabled={!tooltipEnabled}
            content={
              tooltipEnabled && (
                <TooltipBox padding={2}>
                  <Markers
                    markers={markers}
                    validation={memberValidation}
                    renderCustomMarkers={renderCustomMarkers}
                  />
                </TooltipBox>
              )
            }
          >
            <TextRoot
              $level={block.level}
              data-error={hasError ? '' : undefined}
              data-warning={hasWarning ? '' : undefined}
              data-list-item={block.listItem}
              // @todo: rename to `data-markers`
              data-custom-markers={hasMarkers ? '' : undefined}
              data-testid="text-block__text"
              spellCheck={spellCheck}
              ref={forwardedRef}
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
})
