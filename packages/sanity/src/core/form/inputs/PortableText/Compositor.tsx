import React, {useState, useMemo, useCallback} from 'react'
import {
  OnCopyFn,
  OnPasteFn,
  usePortableTextEditor,
  HotkeyOptions,
  BlockRenderProps as EditorBlockRenderProps,
  BlockChildRenderProps as EditorChildRenderProps,
  BlockAnnotationRenderProps,
  EditorSelection,
  RangeDecoration,
} from '@sanity/portable-text-editor'
import {Path, PortableTextBlock, PortableTextTextBlock} from '@sanity/types'
import {Box, Portal, PortalProvider, useBoundaryElement, usePortal} from '@sanity/ui'
import {ArrayOfObjectsInputProps, RenderCustomMarkers} from '../../types'
import {ActivateOnFocus} from '../../components/ActivateOnFocus/ActivateOnFocus'
import {EMPTY_ARRAY} from '../../../util'
import {ChangeIndicator} from '../../../changeIndicators'
import {RenderBlockActionsCallback} from '../../types/_transitional'
import {Annotation} from './object/Annotation'
import {BlockObject} from './object/BlockObject'
import {InlineObject} from './object/InlineObject'
import {TextBlock} from './text'
import {Editor} from './Editor'
import {ExpandedLayer, Root} from './Compositor.styles'
import {useHotkeys} from './hooks/useHotKeys'
import {useTrackFocusPath} from './hooks/useTrackFocusPath'

interface InputProps extends ArrayOfObjectsInputProps<PortableTextBlock> {
  hasFocusWithin: boolean
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
export type PortableTextEditorElement = HTMLDivElement | HTMLSpanElement

/** @internal */
export function Compositor(props: Omit<InputProps, 'schemaType' | 'arrayFunctions'>) {
  const {
    changed,
    focused,
    focusPath = EMPTY_ARRAY,
    hasFocusWithin,
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
    onToggleFullscreen,
    path,
    readOnly,
    rangeDecorations,
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

  const editor = usePortableTextEditor()

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
        ...(hotkeys?.custom || {}),
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
      const {
        children,
        focused: blockFocused,
        path: blockPath,
        selected,
        schemaType: blockSchemaType,
        value: block,
      } = blockProps
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
          schemaType={blockSchemaType}
          selected={selected}
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
      scrollElement,
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
          schemaType={blockSchemaType}
          selected={blockSelected}
          value={blockValue}
        />
      )
    },
    [
      boundaryElement,
      scrollElement,
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
    ],
  )

  // This is the function that is sent to PortableTextEditor's renderBlock callback
  const editorRenderBlock = useCallback(
    (blockProps: EditorBlockRenderProps) => {
      const {value: block} = blockProps
      const isTextBlock = block._type === editor.schemaTypes.block.name
      if (isTextBlock) {
        return renderTextBlock(blockProps)
      }
      return renderObjectBlock(blockProps)
    },
    [editor.schemaTypes.block.name, renderObjectBlock, renderTextBlock],
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
      const isSpan = child._type === editor.schemaTypes.span.name
      if (isSpan) {
        return children
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
          schemaType={childSchemaType}
          selected={selected}
          value={child}
        />
      )
    },
    [
      editor.schemaTypes.span.name,
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
          schemaType={aSchemaType}
          selected={selected}
          value={aValue}
        >
          {children}
        </Annotation>
      )
    },
    [
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
    ],
  )
  const ariaDescribedBy = props.elementProps['aria-describedby']

  // Create an initial editor selection based on the focusPath
  // at the time that the editor mounts. Any updates to the
  // focusPath later will be handled by the useTrackFocusPath hook.
  // The initial selection is handled explicitly as a separate
  // prop to the Editable PTE component (initialSelection) so that
  // selections can be set initially even though the editor value
  // might not be fully propagated or rendered yet.
  const initialSelection: EditorSelection | undefined = useMemo(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only at mount time!

  const editorNode = useMemo(
    () => (
      <Editor
        ariaDescribedBy={ariaDescribedBy}
        initialSelection={initialSelection}
        hotkeys={editorHotkeys}
        isActive={isActive}
        isFullscreen={isFullscreen}
        onItemOpen={onItemOpen}
        onCopy={onCopy}
        onPaste={onPaste}
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
    ),

    // Keep only stable ones here!
    [
      ariaDescribedBy,
      editorHotkeys,
      editorRenderAnnotation,
      editorRenderBlock,
      editorRenderChild,
      handleToggleFullscreen,
      initialSelection,
      isActive,
      isFullscreen,
      onCopy,
      onItemOpen,
      onPaste,
      path,
      rangeDecorations,
      readOnly,
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
    <PortalProvider __unstable_elements={portalElements}>
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
              </Portal>
            </Box>
            <div data-border="" />
          </Root>
        </ChangeIndicator>
      </ActivateOnFocus>
    </PortalProvider>
  )
}
