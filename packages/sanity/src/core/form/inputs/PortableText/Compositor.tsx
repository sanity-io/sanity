import {
  type BlockAnnotationRenderProps,
  type BlockChildRenderProps as EditorChildRenderProps,
  type BlockRenderProps as EditorBlockRenderProps,
  type EditorSelection,
  type HotkeyOptions,
  type OnCopyFn,
  type OnPasteFn as EditorOnPasteFn,
  type PasteData as EditorPasteData,
  type RangeDecoration,
} from '@portabletext/editor'
import {type Path, type PortableTextBlock, type PortableTextTextBlock} from '@sanity/types'
import {Box, Portal, PortalProvider, useBoundaryElement, usePortal} from '@sanity/ui'
import {type ReactNode, useCallback, useMemo, useState} from 'react'

import {ChangeIndicator} from '../../../changeIndicators'
import {EMPTY_ARRAY} from '../../../util'
import {ActivateOnFocus} from '../../components/ActivateOnFocus/ActivateOnFocus'
import {type ArrayOfObjectsInputProps, type RenderCustomMarkers} from '../../types'
import {type RenderBlockActionsCallback} from '../../types/_transitional'
import {type OnPasteFn} from '../../types/inputProps'
import {UploadTargetCard} from '../files/common/uploadTarget/UploadTargetCard'
import {ExpandedLayer, Root, StringDiffContainer} from './Compositor.styles'
import {useSetPortableTextMemberItemElementRef} from './contexts/PortableTextMemberItemElementRefsProvider'
import {usePortableTextMemberSchemaTypes} from './contexts/PortableTextMemberSchemaTypes'
import {SelectedAnnotationsProvider} from './contexts/SelectedAnnotationsContext'
import {Editor} from './Editor'
import {useHotkeys} from './hooks/useHotKeys'
import {useTrackFocusPath} from './hooks/useTrackFocusPath'
import {Annotation} from './object/Annotation'
import {BlockObject} from './object/BlockObject'
import {CombinedAnnotationPopover} from './object/CombinedAnnotationPopover'
import {InlineObject} from './object/InlineObject'
import {AnnotationObjectEditModal} from './object/modals/AnnotationObjectEditModal'
import {TextBlock} from './text'

interface InputProps extends ArrayOfObjectsInputProps<PortableTextBlock> {
  elementRef: React.RefObject<HTMLDivElement | null>
  hasFocusWithin: boolean
  hideToolbar?: boolean
  hotkeys?: HotkeyOptions
  isActive: boolean
  isFullscreen: boolean
  onActivate: () => void
  onCopy?: OnCopyFn
  onPaste?: OnPasteFn
  onToggleFullscreen: () => void
  path: Path
  rangeDecorations?: RangeDecoration[]
  renderBlockActions?: RenderBlockActionsCallback
  renderCustomMarkers?: RenderCustomMarkers
}

/** @internal */
export function Compositor(props: Omit<InputProps, 'schemaType' | 'arrayFunctions'>): ReactNode {
  const {
    changed,
    elementRef,
    focused,
    focusPath = EMPTY_ARRAY,
    elementProps,
    hasFocusWithin,
    hideToolbar,
    hotkeys,
    isActive,
    isFullscreen,
    onActivate,
    onCopy,
    onItemClose,
    onItemOpen,
    onItemRemove,
    onPaste,
    onPathFocus,
    onSelectFile,
    onToggleFullscreen,
    onUpload,
    path,
    rangeDecorations,
    readOnly,
    renderAnnotation,
    renderBlock,
    renderBlockActions,
    renderCustomMarkers,
    renderField,
    renderInlineBlock,
    renderInput,
    renderItem,
    renderPreview,
    value,
  } = props

  const schemaTypes = usePortableTextMemberSchemaTypes()
  const setElementRef = useSetPortableTextMemberItemElementRef()

  // Wrap the consumer's onPaste to enrich PasteData.schemaTypes with
  // Sanity-specific PortableTextMemberSchemaTypes instead of the editor's
  // EditorSchema. This shields Studio consumers from the PTE v6 type change.
  const wrappedOnPaste: EditorOnPasteFn | undefined = useMemo(() => {
    if (!onPaste) {
      return undefined
    }
    return (data: EditorPasteData) => {
      return onPaste({
        ...data,
        schemaTypes,
      })
    }
  }, [onPaste, schemaTypes])

  const boundaryElement = useBoundaryElement().element
  const [wrapperElement, setWrapperElement] = useState<HTMLDivElement | null>(null)
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null)

  const handleToggleFullscreen = useCallback(() => {
    onToggleFullscreen()
  }, [onToggleFullscreen])

  const hotkeysWithFullscreenToggle = useMemo(
    () => ({
      ...hotkeys,
      custom: {
        'mod+enter': onToggleFullscreen,
        ...hotkeys?.custom,
      },
    }),

    [hotkeys, onToggleFullscreen],
  )

  const editorHotkeys = useHotkeys(hotkeysWithFullscreenToggle)

  const _renderBlockActions = !!value && renderBlockActions ? renderBlockActions : undefined
  const _renderCustomMarkers = !!value && renderCustomMarkers ? renderCustomMarkers : undefined

  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)

  const renderTextBlock = useCallback(
    (blockProps: EditorBlockRenderProps) => {
      const {children, focused: blockFocused, path: blockPath, selected, value: block} = blockProps
      return (
        <TextBlock
          floatingBoundary={boundaryElement}
          focused={blockFocused}
          isFullscreen={isFullscreen}
          onItemClose={onItemClose}
          onItemOpen={onItemOpen}
          onItemRemove={onItemRemove}
          onPathFocus={onPathFocus}
          path={path.concat(blockPath)}
          readOnly={readOnly}
          referenceBoundary={scrollElement}
          renderAnnotation={renderAnnotation}
          renderField={renderField}
          renderInlineBlock={renderInlineBlock}
          renderInput={renderInput}
          renderItem={renderItem}
          renderBlockActions={_renderBlockActions}
          renderCustomMarkers={_renderCustomMarkers}
          renderPreview={renderPreview}
          renderBlock={renderBlock}
          schemaType={schemaTypes.block}
          selected={selected}
          setElementRef={setElementRef}
          value={block as PortableTextTextBlock}
        >
          {children}
        </TextBlock>
      )
    },
    [
      _renderBlockActions,
      _renderCustomMarkers,
      boundaryElement,
      isFullscreen,
      onItemClose,
      onItemOpen,
      onItemRemove,
      onPathFocus,
      path,
      readOnly,
      renderAnnotation,
      renderBlock,
      renderField,
      renderInlineBlock,
      renderInput,
      renderItem,
      renderPreview,
      schemaTypes.block,
      scrollElement,
      setElementRef,
    ],
  )

  const renderObjectBlock = useCallback(
    (blockProps: EditorBlockRenderProps) => {
      const {
        focused: blockFocused,
        path: blockPath,
        selected: blockSelected,
        schemaType: blockSchemaType,
        value: blockValue,
      } = blockProps
      const sanitySchemaType = schemaTypes.blockObjects.find(
        (type) => type.name === blockSchemaType.name,
      )
      if (!sanitySchemaType) {
        // This should never happen
        throw new Error(
          `Could not find Sanity schema type for block object: ${blockSchemaType.name}`,
        )
      }
      return (
        <BlockObject
          floatingBoundary={boundaryElement}
          focused={blockFocused}
          isFullscreen={isFullscreen}
          onItemClose={onItemClose}
          onItemOpen={onItemOpen}
          onItemRemove={onItemRemove}
          onPathFocus={onPathFocus}
          path={path.concat(blockPath)}
          readOnly={readOnly}
          referenceBoundary={scrollElement}
          relativePath={blockPath}
          renderAnnotation={renderAnnotation}
          renderBlock={renderBlock}
          renderBlockActions={_renderBlockActions}
          renderCustomMarkers={_renderCustomMarkers}
          renderField={renderField}
          renderInlineBlock={renderInlineBlock}
          renderInput={renderInput}
          renderItem={renderItem}
          renderPreview={renderPreview}
          schemaType={sanitySchemaType}
          selected={blockSelected}
          setElementRef={setElementRef}
          value={blockValue}
        />
      )
    },
    [
      boundaryElement,
      scrollElement,
      schemaTypes.blockObjects,
      isFullscreen,
      onItemClose,
      onItemOpen,
      onItemRemove,
      onPathFocus,
      path,
      readOnly,
      renderAnnotation,
      renderBlock,
      _renderBlockActions,
      _renderCustomMarkers,
      renderField,
      renderInlineBlock,
      renderInput,
      renderItem,
      renderPreview,
      setElementRef,
    ],
  )

  // This is the function that is sent to PortableTextEditor's renderBlock callback
  const editorRenderBlock = useCallback(
    (blockProps: EditorBlockRenderProps) => {
      const {value: block} = blockProps
      const isTextBlock = block._type === schemaTypes.block.name
      if (isTextBlock) {
        return renderTextBlock(blockProps)
      }
      return renderObjectBlock(blockProps)
    },
    [schemaTypes.block.name, renderObjectBlock, renderTextBlock],
  )

  // This is the function that is sent to PortableTextEditor's renderChild callback
  const editorRenderChild = useCallback(
    (childProps: EditorChildRenderProps) => {
      const {
        children,
        focused: childFocused,
        path: childPath,
        selected,
        schemaType: childSchemaType,
        value: child,
      } = childProps
      const isSpan = child._type === schemaTypes.span.name
      if (isSpan) {
        return children
      }
      const sanitySchemaType = schemaTypes.inlineObjects.find(
        (type) => type.name === childSchemaType.name,
      )
      if (!sanitySchemaType) {
        // This should never happen
        throw new Error(
          `Could not find Sanity schema type for inline object: ${childSchemaType.name}`,
        )
      }
      return (
        <InlineObject
          floatingBoundary={boundaryElement}
          focused={childFocused}
          onItemClose={onItemClose}
          onItemOpen={onItemOpen}
          onPathFocus={onPathFocus}
          path={path.concat(childPath)}
          readOnly={readOnly}
          referenceBoundary={scrollElement}
          relativePath={childPath}
          renderAnnotation={renderAnnotation}
          renderBlock={renderBlock}
          renderCustomMarkers={renderCustomMarkers}
          renderField={renderField}
          renderInlineBlock={renderInlineBlock}
          renderInput={renderInput}
          renderItem={renderItem}
          renderPreview={renderPreview}
          schemaType={sanitySchemaType}
          selected={selected}
          setElementRef={setElementRef}
          value={child}
        />
      )
    },
    [
      schemaTypes.span.name,
      schemaTypes.inlineObjects,
      boundaryElement,
      onItemClose,
      onItemOpen,
      onPathFocus,
      path,
      readOnly,
      scrollElement,
      renderAnnotation,
      renderBlock,
      renderCustomMarkers,
      renderField,
      renderInlineBlock,
      renderInput,
      renderItem,
      renderPreview,
      setElementRef,
    ],
  )

  const editorRenderAnnotation = useCallback(
    (annotationProps: BlockAnnotationRenderProps) => {
      const {
        children,
        focused: editorNodeFocused,
        path: aPath,
        selected,
        schemaType: aSchemaType,
        value: aValue,
      } = annotationProps
      const sanitySchemaType = schemaTypes.annotations.find(
        (type) => type.name === aSchemaType.name,
      )
      if (!sanitySchemaType) {
        // This should never happen
        throw new Error(`Could not find Sanity schema type for annotation: ${aSchemaType.name}`)
      }
      return (
        <Annotation
          editorNodeFocused={editorNodeFocused}
          floatingBoundary={boundaryElement}
          focused={Boolean(focused)}
          onItemClose={onItemClose}
          onItemOpen={onItemOpen}
          onPathFocus={onPathFocus}
          path={path.concat(aPath)}
          readOnly={readOnly}
          referenceBoundary={scrollElement}
          renderAnnotation={renderAnnotation}
          renderBlock={renderBlock}
          renderCustomMarkers={renderCustomMarkers}
          renderField={renderField}
          renderInlineBlock={renderInlineBlock}
          renderInput={renderInput}
          renderItem={renderItem}
          renderPreview={renderPreview}
          schemaType={sanitySchemaType}
          selected={selected}
          setElementRef={setElementRef}
          value={aValue}
        >
          {children}
        </Annotation>
      )
    },
    [
      schemaTypes.annotations,
      boundaryElement,
      scrollElement,
      focused,
      onItemClose,
      onItemOpen,
      onPathFocus,
      path,
      readOnly,
      renderAnnotation,
      renderBlock,
      renderCustomMarkers,
      renderField,
      renderInlineBlock,
      renderInput,
      renderItem,
      renderPreview,
      setElementRef,
    ],
  )
  const ariaDescribedBy = elementProps['aria-describedby']

  // Create an initial editor selection based on the focusPath
  // at the time that the editor mounts. Any updates to the
  // focusPath later will be handled by the useTrackFocusPath hook.
  // The initial selection is handled explicitly as a separate
  // prop to the Editable PTE component (initialSelection) so that
  // selections can be set initially even though the editor value
  // might not be fully propagated or rendered yet.
  const [initialSelection] = useState<EditorSelection | undefined>(() => {
    // We can be sure that the focusPath is pointing directly to
    // editor content when hasFocusWithin is true.
    if (hasFocusWithin) {
      return {
        anchor: {
          path: focusPath,
          offset: 0,
        },
        focus: {
          path: focusPath,
          offset: 0,
        },
      }
    }
    return undefined
  })

  const isOneLineEditor = Boolean(schemaTypes.block.options?.oneLine)

  const editorNode = useMemo(
    () => (
      <UploadTargetCard
        isReadOnly={readOnly}
        onSelectFile={onSelectFile}
        onUpload={onUpload}
        pasteTarget={wrapperElement || undefined}
        tabIndex={-1}
        types={schemaTypes.portableText.of}
      >
        <StringDiffContainer>
          <Editor
            ariaDescribedBy={ariaDescribedBy}
            elementRef={elementRef}
            initialSelection={initialSelection}
            hideToolbar={hideToolbar}
            hotkeys={editorHotkeys}
            isActive={isActive}
            isFullscreen={isFullscreen}
            isOneLine={isOneLineEditor}
            onItemOpen={onItemOpen}
            onCopy={onCopy}
            onPaste={wrappedOnPaste}
            onToggleFullscreen={handleToggleFullscreen}
            path={path}
            rangeDecorations={rangeDecorations}
            readOnly={readOnly}
            renderAnnotation={editorRenderAnnotation}
            renderBlock={editorRenderBlock}
            renderChild={editorRenderChild}
            setPortalElement={setPortalElement}
            scrollElement={scrollElement}
            setScrollElement={setScrollElement}
          />
        </StringDiffContainer>
      </UploadTargetCard>
    ),

    // Keep only stable ones here!
    [
      readOnly,
      onSelectFile,
      onUpload,
      wrapperElement,
      schemaTypes.portableText.of,
      ariaDescribedBy,
      elementRef,
      initialSelection,
      hideToolbar,
      editorHotkeys,
      isActive,
      isFullscreen,
      isOneLineEditor,
      onItemOpen,
      onCopy,
      wrappedOnPaste,
      handleToggleFullscreen,
      path,
      rangeDecorations,
      editorRenderAnnotation,
      editorRenderBlock,
      editorRenderChild,
      scrollElement,
    ],
  )

  const portal = usePortal()
  const portalElements = useMemo(
    () => ({
      collapsed: wrapperElement,
      default: portal.element,
      editor: portalElement,
      expanded: portal.element,
    }),

    [portal.element, portalElement, wrapperElement],
  )

  // Scroll to the DOM element of the "opened" portable text member when relevant.
  useTrackFocusPath({
    focusPath,
    boundaryElement: scrollElement,
    onItemClose,
  })

  // The editor should have a focus ring when the field itself is focused,
  // or focus is pointing directly to a node inside the editor
  // (as opposed to focus on fields inside object nodes like annotations, inline blocks etc.)
  const editorFocused = focused || hasFocusWithin

  return (
    <SelectedAnnotationsProvider>
      <PortalProvider __unstable_elements={portalElements} element={portal.element}>
        <ActivateOnFocus onActivate={onActivate} isOverlayActive={!isActive}>
          <ChangeIndicator
            disabled={isFullscreen}
            hasFocus={Boolean(focused)}
            isChanged={changed}
            path={path}
          >
            <Root
              data-focused={editorFocused ? '' : undefined}
              data-read-only={readOnly ? '' : undefined}
            >
              <Box data-wrapper="" ref={setWrapperElement}>
                <Portal __unstable_name={isFullscreen ? 'expanded' : 'collapsed'}>
                  {isFullscreen ? <ExpandedLayer>{editorNode}</ExpandedLayer> : editorNode}
                  <AnnotationObjectEditModal
                    focused={focused}
                    onItemClose={onItemClose}
                    referenceBoundary={scrollElement}
                  />
                  <CombinedAnnotationPopover
                    floatingBoundary={boundaryElement}
                    referenceBoundary={scrollElement}
                  />
                </Portal>
              </Box>
              <div data-border="" />
            </Root>
          </ChangeIndicator>
        </ActivateOnFocus>
      </PortalProvider>
    </SelectedAnnotationsProvider>
  )
}
