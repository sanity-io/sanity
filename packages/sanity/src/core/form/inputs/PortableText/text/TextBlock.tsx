import {Box, Flex, ResponsivePaddingProps, Tooltip, Text} from '@sanity/ui'
import React, {ComponentType, RefObject, useCallback, useMemo, useState} from 'react'
import {BlockSchemaType, Path, PortableTextTextBlock} from '@sanity/types'
import {
  EditorSelection,
  PortableTextEditor,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import {BlockProps, RenderCustomMarkers} from '../../../types'
import {PatchArg} from '../../../patch'
import {useFormBuilder} from '../../../useFormBuilder'
import {BlockActions} from '../BlockActions'
import {ReviewChangesHighlightBlock, StyledChangeIndicatorWithProvidedFullPath} from '../_common'
import {RenderBlockActionsCallback} from '../types'
import {useMemberValidation} from '../hooks/useMemberValidation'
import {usePortableTextMarkers} from '../hooks/usePortableTextMarkers'
import {usePortableTextMemberItem} from '../hooks/usePortableTextMembers'
import {pathToString} from '../../../../field'
import {debugRender} from '../debugRender'
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
import {TextContainer} from './textStyles'

export interface TextBlockProps {
  block: PortableTextTextBlock
  children: React.ReactNode
  focused: boolean
  isFullscreen?: boolean
  onChange: (...patches: PatchArg[]) => void
  path: Path
  readOnly?: boolean
  renderBlockActions?: RenderBlockActionsCallback
  renderCustomMarkers?: RenderCustomMarkers
  selected: boolean
  spellCheck?: boolean
  type: BlockSchemaType
}

export function TextBlock(props: TextBlockProps) {
  const {
    block,
    children,
    focused,
    isFullscreen,
    onChange,
    path,
    readOnly,
    renderBlockActions,
    renderCustomMarkers,
    selected,
    spellCheck,
    type,
  } = props
  const {Markers} = useFormBuilder().__internal.components
  const [reviewChangesHovered, setReviewChangesHovered] = useState<boolean>(false)
  const markers = usePortableTextMarkers(path)
  const memberItem = usePortableTextMemberItem(pathToString(path))
  const editor = usePortableTextEditor()

  const handleChangeIndicatorMouseEnter = useCallback(() => setReviewChangesHovered(true), [])
  const handleChangeIndicatorMouseLeave = useCallback(() => setReviewChangesHovered(false), [])

  const {validation, hasError, hasWarning, hasInfo} = useMemberValidation(memberItem?.node)

  const hasMarkers = Boolean(renderCustomMarkers) && markers.length > 0

  const tooltipEnabled = hasError || hasWarning || hasMarkers || hasInfo

  const text = useMemo(() => {
    return (
      <TextFlex align="flex-start" $level={block?.level}>
        {block.listItem && (
          <ListPrefixWrapper contentEditable={false}>
            <Text data-list-prefix="">
              <TextContainer />
            </Text>
          </ListPrefixWrapper>
        )}
        <div data-text="" style={debugRender()}>
          {children}
        </div>
      </TextFlex>
    )
  }, [block.listItem, block.level, children])

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

    return TEXT_STYLE_PADDING[block.style || 'normal'] || {paddingY: 2}
  }, [block])

  const defaultRendered = useMemo(
    () => (
      <Box data-testid="text-block" {...outerPaddingProps}>
        <TextBlockFlexWrapper data-testid="text-block__wrapper">
          <Flex
            flex={1}
            {...innerPaddingProps}
            ref={memberItem?.elementRef as RefObject<HTMLDivElement>}
          >
            <Box flex={1}>
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
                  data-error={hasError ? '' : undefined}
                  data-list-item={block.listItem}
                  data-markers={hasMarkers ? '' : undefined}
                  data-read-only={readOnly}
                  data-testid="text-block__text"
                  data-warning={hasWarning ? '' : undefined}
                  $level={block.level || 1}
                  spellCheck={spellCheck}
                >
                  {text}
                </TextRoot>
              </Tooltip>
            </Box>

            <BlockExtrasContainer contentEditable={false}>
              <BlockActionsOuter marginRight={1}>
                <BlockActionsInner>
                  {renderBlockActions && focused && !readOnly && (
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
          </Flex>
        </TextBlockFlexWrapper>
      </Box>
    ),
    [
      Markers,
      block,
      focused,
      handleChangeIndicatorMouseEnter,
      handleChangeIndicatorMouseLeave,
      hasError,
      hasMarkers,
      hasWarning,
      innerPaddingProps,
      isFullscreen,
      markers,
      memberItem,
      onChange,
      outerPaddingProps,
      readOnly,
      renderBlockActions,
      renderCustomMarkers,
      reviewChangesHovered,
      spellCheck,
      text,
      tooltipEnabled,
      validation,
    ]
  )

  const onRemove = useCallback(() => {
    const sel: EditorSelection = {focus: {path, offset: 0}, anchor: {path, offset: 0}}
    PortableTextEditor.delete(editor, sel, {mode: 'blocks'})
    // Focus will not stick unless this is done through a timeout when deleted through clicking the menu button.
    setTimeout(() => PortableTextEditor.focus(editor))
  }, [editor, path])

  const CustomComponent = type.components?.block as ComponentType<BlockProps>

  const renderDefault = useCallback(() => defaultRendered, [defaultRendered])
  const notImplementedWarning = useCallback(() => {
    console.warn("Regular text blocks don't open or close, but are edited inline.")
  }, [])

  return CustomComponent ? (
    <CustomComponent
      focused={focused}
      onClose={notImplementedWarning}
      onOpen={notImplementedWarning}
      onRemove={onRemove}
      open={memberItem?.member.open || false}
      path={memberItem?.node.path || path}
      renderDefault={renderDefault}
      selected={selected}
      value={block}
    >
      <TextRoot
        data-error={hasError ? '' : undefined}
        data-list-item={block.listItem}
        data-markers={hasMarkers ? '' : undefined}
        data-read-only={readOnly}
        data-testid="text-block__text"
        data-warning={hasWarning ? '' : undefined}
        $level={block.level || 1}
        spellCheck={spellCheck}
      >
        {text}
      </TextRoot>
    </CustomComponent>
  ) : (
    defaultRendered
  )
}
