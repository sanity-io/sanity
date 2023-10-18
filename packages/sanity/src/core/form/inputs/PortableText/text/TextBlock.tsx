import {Box, Flex, ResponsivePaddingProps, Tooltip, Text} from '@sanity/ui'
import React, {RefObject, useCallback, useMemo, useState} from 'react'
import {ObjectSchemaType, Path, PortableTextTextBlock} from '@sanity/types'
import {
  EditorSelection,
  PortableTextEditor,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import {isEqual} from '@sanity/util/paths'
import {
  BlockProps,
  RenderAnnotationCallback,
  RenderArrayOfObjectsItemCallback,
  RenderBlockCallback,
  RenderCustomMarkers,
  RenderFieldCallback,
  RenderInputCallback,
  RenderPreviewCallback,
} from '../../../types'
import {useFormBuilder} from '../../../useFormBuilder'
import {BlockActions} from '../BlockActions'
import {ReviewChangesHighlightBlock, StyledChangeIndicatorWithProvidedFullPath} from '../_common'
import {RenderBlockActionsCallback} from '../../../types/_transitional'
import {useMemberValidation} from '../hooks/useMemberValidation'
import {usePortableTextMarkers} from '../hooks/usePortableTextMarkers'
import {usePortableTextMemberItem} from '../hooks/usePortableTextMembers'
import {pathToString} from '../../../../field'
import {debugRender} from '../debugRender'
import {EMPTY_ARRAY} from '../../../../util'
import {useChildPresence} from '../../../studio/contexts/Presence'
import {useFormCallbacks} from '../../../studio'
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
  children: React.ReactNode
  floatingBoundary: HTMLElement | null
  focused: boolean
  isFullscreen?: boolean
  onItemClose: () => void
  onItemOpen: (path: Path) => void
  onItemRemove: (itemKey: string) => void
  onPathFocus: (path: Path) => void
  path: Path
  readOnly?: boolean
  referenceBoundary: HTMLElement | null
  renderAnnotation?: RenderAnnotationCallback
  renderBlock?: RenderBlockCallback
  renderBlockActions?: RenderBlockActionsCallback
  renderCustomMarkers?: RenderCustomMarkers
  renderField: RenderFieldCallback
  renderInlineBlock?: RenderBlockCallback
  renderInput: RenderInputCallback
  renderItem: RenderArrayOfObjectsItemCallback
  renderPreview: RenderPreviewCallback
  schemaType: ObjectSchemaType
  selected: boolean
  spellCheck?: boolean
  value: PortableTextTextBlock
}

export function TextBlock(props: TextBlockProps) {
  const {
    children,
    floatingBoundary,
    focused,
    isFullscreen,
    onItemClose,
    onItemOpen,
    onPathFocus,
    path,
    readOnly,
    referenceBoundary,
    renderBlock,
    renderAnnotation,
    renderBlockActions,
    renderCustomMarkers,
    renderField,
    renderInlineBlock,
    renderInput,
    renderItem,
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
  const {onChange} = useFormCallbacks()

  const presence = useChildPresence(path, true)
  // Include all presence paths pointing either directly to a block, or directly to a block child
  // (which is where the user most of the time would have the presence in a text block)
  const textPresence = useMemo(() => {
    return presence.filter(
      (p) =>
        isEqual(p.path, path) ||
        (p.path.slice(-3)[1] === 'children' && p.path.length - path.length === 2),
    )
  }, [path, presence])

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
    const point = {path: path.slice(-1), offset: 0}
    const sel: EditorSelection = {
      focus: point,
      anchor: point,
    }
    PortableTextEditor.delete(editor, sel, {mode: 'blocks'})
    PortableTextEditor.focus(editor)
  }, [path, editor])

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

  const componentProps: BlockProps = useMemo(
    () => ({
      __unstable_floatingBoundary: floatingBoundary,
      __unstable_referenceBoundary: referenceBoundary,
      __unstable_referenceElement: (memberItem?.elementRef?.current || null) as HTMLElement | null,
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
      presence: textPresence,
      readOnly: Boolean(readOnly),
      renderAnnotation,
      renderBlock,
      renderDefault: DefaultComponent,
      renderField,
      renderInput,
      renderInlineBlock,
      renderItem,
      renderPreview,
      schemaType,
      selected,
      validation,
      value,
    }),
    [
      floatingBoundary,
      focused,
      isOpen,
      markers,
      memberItem?.elementRef,
      memberItem?.node.path,
      onItemClose,
      onOpen,
      onPathFocus,
      onRemove,
      parentSchemaType,
      readOnly,
      referenceBoundary,
      renderAnnotation,
      renderBlock,
      renderField,
      renderInlineBlock,
      renderInput,
      renderItem,
      renderPreview,
      schemaType,
      selected,
      text,
      textPresence,
      validation,
      value,
    ],
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
    [Markers, markers, renderCustomMarkers, tooltipEnabled, validation],
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
                  {renderBlock && renderBlock(componentProps)}
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
      renderBlock,
      renderBlockActions,
      reviewChangesHovered,
      spellCheck,
      toolTipContent,
      tooltipEnabled,
      value,
    ],
  )
}

export const DefaultComponent = (props: BlockProps) => {
  return <>{props.children}</>
}
