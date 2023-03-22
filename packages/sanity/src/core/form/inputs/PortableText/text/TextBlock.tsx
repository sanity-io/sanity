import {Box, Flex, ResponsivePaddingProps, Tooltip, Text} from '@sanity/ui'
import React, {ComponentType, RefObject, useCallback, useMemo, useState} from 'react'
import {ObjectSchemaType, Path, PortableTextTextBlock} from '@sanity/types'
import {
  EditorSelection,
  PortableTextEditor,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import {BlockProps, RenderCustomMarkers, RenderPreviewCallback} from '../../../types'
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
import {EMPTY_ARRAY} from '../../../../util'
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
  boundaryElement?: HTMLElement
  children: React.ReactNode
  focused: boolean
  isFullscreen?: boolean
  onChange: (...patches: PatchArg[]) => void
  onItemClose: () => void
  onItemOpen: (path: Path) => void
  onItemRemove: (itemKey: string) => void
  onPathFocus: (path: Path) => void
  path: Path
  readOnly?: boolean
  renderBlockActions?: RenderBlockActionsCallback
  renderCustomMarkers?: RenderCustomMarkers
  renderPreview: RenderPreviewCallback
  schemaType: ObjectSchemaType
  selected: boolean
  spellCheck?: boolean
  value: PortableTextTextBlock
}

export function TextBlock(props: TextBlockProps) {
  const {
    boundaryElement,
    children,
    focused,
    isFullscreen,
    onChange,
    onItemClose,
    onItemOpen,
    onPathFocus,
    path,
    readOnly,
    renderBlockActions,
    renderCustomMarkers,
    renderPreview,
    schemaType,
    selected,
    spellCheck,
    value,
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

  const onOpen = useCallback(() => {
    if (memberItem) {
      onItemOpen(memberItem.node.path)
    }
  }, [onItemOpen, memberItem])

  const onRemove = useCallback(() => {
    const sel: EditorSelection = {focus: {path, offset: 0}, anchor: {path, offset: 0}}
    PortableTextEditor.delete(editor, sel, {mode: 'blocks'})
    // Focus will not stick unless this is done through a timeout when deleted through clicking the menu button.
    setTimeout(() => PortableTextEditor.focus(editor))
  }, [editor, path])

  const text = useMemo(() => {
    return (
      <TextFlex align="flex-start" $level={value?.level}>
        {value.listItem && (
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
  }, [value.listItem, value.level, children])

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
    if (value.listItem) {
      return {paddingY: 2}
    }

    return TEXT_STYLE_PADDING[value.style || 'normal'] || {paddingY: 2}
  }, [value])

  const isOpen = Boolean(memberItem?.member.open)
  const parentSchemaType = editor.schemaTypes.portableText
  const presence = memberItem?.node.presence || EMPTY_ARRAY

  const CustomComponent = schemaType.components?.block as ComponentType<BlockProps> | undefined
  const componentProps: BlockProps = useMemo(
    () => ({
      __unstable_boundaryElement: boundaryElement || undefined,
      __unstable_referenceElement: memberItem?.elementRef?.current || undefined,
      children: text,
      focused,
      markers,
      onClose: onItemClose,
      onOpen,
      onPathFocus,
      onRemove,
      open: isOpen,
      parentSchemaType,
      path: memberItem?.node.path || EMPTY_ARRAY,
      presence,
      readOnly: Boolean(readOnly),
      renderDefault: DefaultComponent,
      renderPreview,
      schemaType,
      selected,
      validation,
      value,
    }),
    [
      boundaryElement,
      focused,
      isOpen,
      markers,
      memberItem,
      onItemClose,
      onOpen,
      onPathFocus,
      onRemove,
      parentSchemaType,
      presence,
      readOnly,
      renderPreview,
      schemaType,
      selected,
      text,
      validation,
      value,
    ]
  )

  const toolTipContent = useMemo(
    () =>
      (tooltipEnabled && (
        <TooltipBox padding={2}>
          <Markers
            markers={markers}
            renderCustomMarkers={renderCustomMarkers}
            validation={validation}
          />
        </TooltipBox>
      )) ||
      null,
    [Markers, markers, renderCustomMarkers, tooltipEnabled, validation]
  )

  return useMemo(
    () => (
      <Box
        data-testid="text-block"
        {...outerPaddingProps}
        style={debugRender()}
        ref={memberItem?.elementRef as RefObject<HTMLDivElement>}
      >
        <TextBlockFlexWrapper data-testid="text-block__wrapper">
          <Flex flex={1} {...innerPaddingProps}>
            <Box flex={1}>
              <Tooltip
                content={toolTipContent}
                disabled={!tooltipEnabled}
                placement="top"
                portal="editor"
              >
                <TextRoot
                  $level={value.level || 1}
                  data-error={hasError ? '' : undefined}
                  data-list-item={value.listItem}
                  data-markers={hasMarkers ? '' : undefined}
                  data-read-only={readOnly}
                  data-testid="text-block__text"
                  data-warning={hasWarning ? '' : undefined}
                  spellCheck={spellCheck}
                >
                  {CustomComponent ? (
                    <CustomComponent {...componentProps} />
                  ) : (
                    <DefaultComponent {...componentProps} />
                  )}
                </TextRoot>
              </Tooltip>
            </Box>

            <BlockExtrasContainer contentEditable={false}>
              <BlockActionsOuter marginRight={1}>
                <BlockActionsInner>
                  {renderBlockActions && focused && !readOnly && (
                    <BlockActions
                      onChange={onChange}
                      block={value}
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
      componentProps,
      CustomComponent,
      focused,
      handleChangeIndicatorMouseEnter,
      handleChangeIndicatorMouseLeave,
      hasError,
      hasMarkers,
      hasWarning,
      innerPaddingProps,
      isFullscreen,
      memberItem,
      onChange,
      outerPaddingProps,
      readOnly,
      renderBlockActions,
      reviewChangesHovered,
      spellCheck,
      toolTipContent,
      tooltipEnabled,
      value,
    ]
  )
}

export const DefaultComponent = (props: BlockProps) => {
  return <>{props.children}</>
}
