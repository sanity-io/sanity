/* eslint-disable complexity */
import {
  PortableTextEditor,
  EditorSelection,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import {ObjectSchemaType, Path, PortableTextBlock} from '@sanity/types'
import {Tooltip, Flex, ResponsivePaddingProps, Box} from '@sanity/ui'
import React, {ComponentType, PropsWithChildren, useCallback, useMemo, useState} from 'react'
import {PatchArg} from '../../../patch'
import {BlockProps, RenderCustomMarkers, RenderPreviewCallback} from '../../../types'
import {RenderBlockActionsCallback} from '../types'
import {BlockActions} from '../BlockActions'
import {ReviewChangesHighlightBlock, StyledChangeIndicatorWithProvidedFullPath} from '../_common'
import {useFormBuilder} from '../../../useFormBuilder'
import {useMemberValidation} from '../hooks/useMemberValidation'
import {usePortableTextMarkers} from '../hooks/usePortableTextMarkers'
import {usePortableTextMemberItem} from '../hooks/usePortableTextMembers'
import {pathToString} from '../../../../field'
import {debugRender} from '../debugRender'
import {EMPTY_ARRAY} from '../../../../util'
import {
  Root,
  ChangeIndicatorWrapper,
  InnerFlex,
  BlockActionsOuter,
  BlockActionsInner,
  TooltipBox,
  PreviewContainer,
} from './BlockObject.styles'
import {BlockObjectActionsMenu} from './BlockObjectActionsMenu'
import {ObjectEditModal} from './modals/ObjectEditModal'

interface BlockObjectProps extends PropsWithChildren {
  boundaryElement?: HTMLElement
  focused: boolean
  isActive?: boolean
  isFullscreen?: boolean
  onChange: (...patches: PatchArg[]) => void
  onItemClose: () => void
  onItemOpen: (path: Path) => void
  onItemRemove: (itemKey: string) => void
  onPathFocus: (path: Path) => void
  path: Path
  readOnly?: boolean
  relativePath: Path
  renderBlockActions?: RenderBlockActionsCallback
  renderCustomMarkers?: RenderCustomMarkers
  renderPreview: RenderPreviewCallback
  schemaType: ObjectSchemaType
  selected: boolean
  value: PortableTextBlock
}

export function BlockObject(props: BlockObjectProps) {
  const {
    focused,
    isFullscreen,
    onChange,
    onItemOpen,
    onItemClose,
    onPathFocus,
    path,
    readOnly,
    relativePath,
    renderBlockActions,
    renderCustomMarkers,
    renderPreview,
    boundaryElement,
    selected,
    schemaType,
    value,
  } = props
  const {Markers} = useFormBuilder().__internal.components
  const [reviewChangesHovered, setReviewChangesHovered] = useState<boolean>(false)
  const markers = usePortableTextMarkers(path)
  const editor = usePortableTextEditor()
  const memberItem = usePortableTextMemberItem(pathToString(path))

  const handleMouseOver = useCallback(() => setReviewChangesHovered(true), [])
  const handleMouseOut = useCallback(() => setReviewChangesHovered(false), [])

  const onOpen = useCallback(() => {
    PortableTextEditor.blur(editor)
    onItemOpen(path)
  }, [editor, onItemOpen, path])

  const onClose = useCallback(() => {
    onItemClose()
    PortableTextEditor.focus(editor)
  }, [editor, onItemClose])

  const onRemove = useCallback(() => {
    const sel: EditorSelection = {
      focus: {path: relativePath, offset: 0},
      anchor: {path: relativePath, offset: 0},
    }
    PortableTextEditor.delete(editor, sel, {mode: 'blocks'})
    // Focus will not stick unless this is done through a timeout when deleted through clicking the menu button.
    setTimeout(() => PortableTextEditor.focus(editor))
  }, [editor, relativePath])

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

  const {validation, hasError, hasWarning, hasInfo} = useMemberValidation(memberItem?.node)
  const parentSchemaType = editor.schemaTypes.portableText
  const hasMarkers = Boolean(markers.length > 0)

  const presence = memberItem?.node.presence || EMPTY_ARRAY

  // Tooltip indicating validation errors, warnings, info and markers
  const tooltipEnabled = hasError || hasWarning || hasInfo || hasMarkers
  const toolTipContent = useMemo(
    () =>
      (tooltipEnabled && (
        <TooltipBox padding={2}>
          <Markers
            markers={markers}
            validation={validation}
            renderCustomMarkers={renderCustomMarkers}
          />
        </TooltipBox>
      )) ||
      null,
    [Markers, markers, renderCustomMarkers, tooltipEnabled, validation]
  )

  const isOpen = Boolean(memberItem?.member.open)
  const input = memberItem?.input

  const CustomComponent = schemaType.components?.block as ComponentType<BlockProps> | undefined
  const componentProps: BlockProps = useMemo(
    () => ({
      __unstable_boundaryElement: boundaryElement || undefined,
      __unstable_referenceElement: memberItem?.elementRef?.current || undefined,
      children: input,
      focused,
      markers,
      onClose,
      onOpen,
      onPathFocus,
      onRemove,
      open: isOpen,
      parentSchemaType,
      path: memberItem?.node.path || EMPTY_ARRAY,
      presence,
      readOnly: Boolean(readOnly),
      renderDefault: DefaultBlockObjectComponent,
      renderPreview,
      schemaType,
      selected,
      validation,
      value,
    }),
    [
      boundaryElement,
      focused,
      input,
      isOpen,
      markers,
      memberItem?.elementRef,
      memberItem?.node.path,
      onClose,
      onOpen,
      onPathFocus,
      onRemove,
      parentSchemaType,
      presence,
      readOnly,
      renderPreview,
      schemaType,
      selected,
      validation,
      value,
    ]
  )

  return useMemo(
    () => (
      <Box
        ref={memberItem?.elementRef as React.RefObject<HTMLDivElement> | undefined}
        contentEditable={false}
      >
        <Flex paddingBottom={1} marginY={3} style={debugRender()}>
          <InnerFlex flex={1}>
            <Tooltip
              placement="top"
              portal="editor"
              disabled={!tooltipEnabled}
              content={toolTipContent}
            >
              <PreviewContainer {...innerPaddingProps}>
                {CustomComponent ? (
                  <CustomComponent {...componentProps} />
                ) : (
                  <DefaultBlockObjectComponent {...componentProps} />
                )}
              </PreviewContainer>
            </Tooltip>
            <BlockActionsOuter marginRight={1}>
              <BlockActionsInner>
                {renderBlockActions && value && focused && !readOnly && (
                  <BlockActions
                    block={value}
                    onChange={onChange}
                    renderBlockActions={renderBlockActions}
                  />
                )}
              </BlockActionsInner>
            </BlockActionsOuter>

            {isFullscreen && memberItem && (
              <ChangeIndicatorWrapper
                $hasChanges={memberItem.member.item.changed}
                onMouseOut={handleMouseOut}
                onMouseOver={handleMouseOver}
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
          </InnerFlex>
        </Flex>
      </Box>
    ),
    [
      CustomComponent,
      componentProps,
      focused,
      handleMouseOut,
      handleMouseOver,
      innerPaddingProps,
      isFullscreen,
      memberItem,
      onChange,
      readOnly,
      renderBlockActions,
      reviewChangesHovered,
      toolTipContent,
      tooltipEnabled,
      value,
    ]
  )
}

export const DefaultBlockObjectComponent = (props: BlockProps) => {
  const {
    __unstable_boundaryElement,
    __unstable_referenceElement,
    children,
    focused,
    markers,
    onClose,
    onOpen,
    onRemove,
    open,
    path,
    readOnly,
    renderPreview,
    selected,
    schemaType,
    value,
    validation,
  } = props
  const isImagePreview = schemaType.name === 'image'
  const hasError = validation.filter((v) => v.level === 'error').length > 0
  const hasWarning = validation.filter((v) => v.level === 'warning').length > 0
  const hasMarkers = Boolean(markers.length > 0)
  const tone = selected || focused ? 'primary' : 'default'

  const handleDoubleClickToOpen = useCallback(
    (e: React.MouseEvent<Element, MouseEvent>) => {
      e.preventDefault()
      e.stopPropagation()
      onOpen()
    },
    [onOpen]
  )

  return (
    <>
      <Root
        data-focused={focused ? '' : undefined}
        data-image-preview={isImagePreview ? '' : undefined}
        data-invalid={hasError ? '' : undefined}
        data-markers={hasMarkers ? '' : undefined}
        data-read-only={readOnly ? '' : undefined}
        data-selected={selected ? '' : undefined}
        data-testid="pte-block-object"
        data-warning={hasWarning ? '' : undefined}
        flex={1}
        onDoubleClick={handleDoubleClickToOpen}
        padding={isImagePreview ? 0 : 1}
        tone={tone}
      >
        {renderPreview({
          actions: (
            <BlockObjectActionsMenu
              focused={focused}
              isOpen={open}
              onOpen={onOpen}
              onRemove={onRemove}
              readOnly={readOnly}
              value={value}
            />
          ),
          layout: isImagePreview ? 'blockImage' : 'block',
          schemaType,
          value,
        })}
      </Root>
      {open && (
        <ObjectEditModal
          boundaryElement={__unstable_boundaryElement}
          defaultType="dialog"
          onClose={onClose}
          path={path}
          schemaType={schemaType}
          referenceElement={__unstable_referenceElement}
        >
          {children}
        </ObjectEditModal>
      )}
    </>
  )
}
