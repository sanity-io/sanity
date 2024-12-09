import {type EditorSelection, PortableTextEditor, usePortableTextEditor} from '@portabletext/editor'
import {type ObjectSchemaType, type Path, type PortableTextTextBlock} from '@sanity/types'
import {Box, Flex, type ResponsivePaddingProps, Text} from '@sanity/ui'
import {isEqual} from '@sanity/util/paths'
import {type ReactNode, useCallback, useMemo, useState} from 'react'

import {Tooltip} from '../../../../../ui-components'
import {pathToString} from '../../../../field'
import {EMPTY_ARRAY} from '../../../../util'
import {useFormCallbacks} from '../../../studio'
import {useChildPresence} from '../../../studio/contexts/Presence'
import {
  type BlockProps,
  type RenderAnnotationCallback,
  type RenderArrayOfObjectsItemCallback,
  type RenderBlockCallback,
  type RenderCustomMarkers,
  type RenderFieldCallback,
  type RenderInputCallback,
  type RenderPreviewCallback,
} from '../../../types'
import {type RenderBlockActionsCallback} from '../../../types/_transitional'
import {useFormBuilder} from '../../../useFormBuilder'
import {ReviewChangesHighlightBlock, StyledChangeIndicatorWithProvidedFullPath} from '../_common'
import {BlockActions} from '../BlockActions'
import {type SetPortableTextMemberItemElementRef} from '../contexts/PortableTextMemberItemElementRefsProvider'
import {debugRender} from '../debugRender'
import {useMemberValidation} from '../hooks/useMemberValidation'
import {usePortableTextMarkers} from '../hooks/usePortableTextMarkers'
import {usePortableTextMemberItem} from '../hooks/usePortableTextMembers'
import {TEXT_STYLE_PADDING} from './constants'
import {
  BlockActionsInner,
  BlockActionsOuter,
  ChangeIndicatorWrapper,
  ListPrefixWrapper,
  TextBlockFlexWrapper,
  TextFlex,
  TextRoot,
  TooltipBox,
} from './TextBlock.styles'
import {TextContainer} from './textStyles'

export interface TextBlockProps {
  children: ReactNode
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
  setElementRef: SetPortableTextMemberItemElementRef
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
    setElementRef,
    spellCheck,
    value,
  } = props
  const {Markers} = useFormBuilder().__internal.components
  const [reviewChangesHovered, setReviewChangesHovered] = useState<boolean>(false)
  const markers = usePortableTextMarkers(path)
  const [divElement, setDivElement] = useState<HTMLDivElement | null>(null)
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
  const referenceElement = divElement

  const componentProps: BlockProps = useMemo(
    () => ({
      __unstable_floatingBoundary: floatingBoundary,
      __unstable_referenceBoundary: referenceBoundary,
      __unstable_referenceElement: referenceElement,
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
      memberItem?.node.path,
      onItemClose,
      onOpen,
      onPathFocus,
      onRemove,
      parentSchemaType,
      readOnly,
      referenceBoundary,
      referenceElement,
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
        <TooltipBox>
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

  const blockActionsEnabled = renderBlockActions && !readOnly
  const changeIndicatorVisible = isFullscreen && memberItem

  const setRef = useCallback(
    (elm: HTMLDivElement) => {
      if (memberItem) {
        setElementRef({key: memberItem.member.key, elementRef: elm})
      }
      setDivElement(elm) // update state here so the reference element is available on first render
    },
    [memberItem, setElementRef, setDivElement],
  )

  return useMemo(
    () => (
      <Box {...outerPaddingProps} data-testid="text-block" ref={setRef} style={debugRender()}>
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

            {blockActionsEnabled && (
              <BlockActionsOuter contentEditable={false} marginRight={3}>
                <BlockActionsInner>
                  {focused && (
                    <BlockActions
                      block={value}
                      onChange={onChange}
                      renderBlockActions={renderBlockActions}
                    />
                  )}
                </BlockActionsInner>
              </BlockActionsOuter>
            )}

            {changeIndicatorVisible && (
              <ChangeIndicatorWrapper
                $hasChanges={memberItem.member.item.changed}
                contentEditable={false}
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
            {reviewChangesHovered && <ReviewChangesHighlightBlock />}
          </Flex>
        </TextBlockFlexWrapper>
      </Box>
    ),
    [
      blockActionsEnabled,
      changeIndicatorVisible,
      componentProps,
      focused,
      handleChangeIndicatorMouseEnter,
      handleChangeIndicatorMouseLeave,
      hasError,
      hasMarkers,
      hasWarning,
      innerPaddingProps,
      memberItem,
      onChange,
      outerPaddingProps,
      readOnly,
      renderBlock,
      renderBlockActions,
      reviewChangesHovered,
      setRef,
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
