import {PortableTextBlock, RenderAttributes} from '@sanity/portable-text-editor'
import {Box, ResponsivePaddingProps, Tooltip} from '@sanity/ui'
import React, {RefObject, useCallback, useMemo, useState} from 'react'
import {RenderCustomMarkers} from '../../../types'
import {PatchArg} from '../../../patch'
import {useFormBuilder} from '../../../useFormBuilder'
import {BlockActions} from '../BlockActions'
import {ReviewChangesHighlightBlock, StyledChangeIndicatorWithProvidedFullPath} from '../_common'
import {RenderBlockActionsCallback} from '../types'
import {useMemberValidation} from '../hooks/useMemberValidation'
import {usePortableTextMarkers} from '../hooks/usePortableTextMarkers'
import {usePortableTextMemberItem} from '../hooks/usePortableTextMembers'
import {pathToString} from '../../../../field/paths'
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

const DEBUG_RENDERING = false

function getRandomColor() {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}

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

export function TextBlock(props: TextBlockProps) {
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
  const markers = usePortableTextMarkers(path)
  const memberItem = usePortableTextMemberItem(pathToString(path))

  const handleChangeIndicatorMouseEnter = useCallback(() => setReviewChangesHovered(true), [])
  const handleChangeIndicatorMouseLeave = useCallback(() => setReviewChangesHovered(false), [])

  const {validation, hasError, hasWarning, hasInfo} = useMemberValidation(memberItem?.node)

  const hasMarkers = Boolean(renderCustomMarkers) && markers.length > 0

  const tooltipEnabled = hasError || hasWarning || hasMarkers || hasInfo

  const text = useMemo(() => {
    const TextStyle = TEXT_STYLES[block.style] || TEXT_STYLES.normal

    return (
      <TextFlex align="flex-start" $level={block?.level}>
        {block.listItem && (
          <ListPrefixWrapper contentEditable={false}>
            <TextStyle data-list-prefix="" />
          </ListPrefixWrapper>
        )}

        <TextStyle data-text="" style={DEBUG_RENDERING ? {color: getRandomColor()} : undefined}>
          {children}
        </TextStyle>
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
        <Box
          flex={1}
          {...innerPaddingProps}
          ref={memberItem?.elementRef as RefObject<HTMLDivElement>}
        >
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
            <TextRoot
              $level={block.level}
              data-error={hasError ? '' : undefined}
              data-warning={hasWarning ? '' : undefined}
              data-list-item={block.listItem}
              // @todo: rename to `data-markers`
              data-custom-markers={hasMarkers ? '' : undefined}
              data-testid="text-block__text"
              spellCheck={spellCheck}
            >
              {text}
            </TextRoot>
          </Tooltip>
          <div contentEditable={false}>
            <BlockExtrasContainer>
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

              {isFullscreen && memberItem && (
                <ChangeIndicatorWrapper
                  $hasChanges={memberItem.member.item.changed}
                  onMouseEnter={handleChangeIndicatorMouseEnter}
                  onMouseLeave={handleChangeIndicatorMouseLeave}
                >
                  <StyledChangeIndicatorWithProvidedFullPath
                    hasFocus={focused}
                    isChanged={memberItem.member.item.changed}
                    path={memberItem.member.item.path}
                    withHoverEffect={false}
                  />
                </ChangeIndicatorWrapper>
              )}
            </BlockExtrasContainer>
            {reviewChangesHovered && <ReviewChangesHighlightBlock />}
          </div>
        </Box>
      </TextBlockFlexWrapper>
    </Box>
  )
}
