import React, {useState, useMemo, useCallback} from 'react'
import {
  EditorSelection,
  OnCopyFn,
  OnPasteFn,
  usePortableTextEditor,
  HotkeyOptions,
  BlockRenderProps,
  BlockChildRenderProps,
  BlockAnnotationRenderProps,
} from '@sanity/portable-text-editor'
import {Path, PortableTextBlock, PortableTextTextBlock} from '@sanity/types'
import {Box, Portal, PortalProvider, usePortal} from '@sanity/ui'
import {ArrayOfObjectsInputProps, RenderCustomMarkers} from '../../types'
import {ActivateOnFocus} from '../../components/ActivateOnFocus/ActivateOnFocus'
import {EMPTY_ARRAY} from '../../../util'
import {ChangeIndicator} from '../../../changeIndicators'
import {BlockObject} from './object/BlockObject'
import {InlineObject} from './object/InlineObject'
import {Annotation, TextBlock} from './text'
import {RenderBlockActionsCallback} from './types'
import {Editor} from './Editor'
import {ExpandedLayer, Root} from './Compositor.styles'
import {useHotkeys} from './hooks/useHotKeys'
import {useScrollToOpenedMember} from './hooks/useScrollToOpenedMember'

interface InputProps extends ArrayOfObjectsInputProps<PortableTextBlock> {
  hasFocus: boolean
  hotkeys?: HotkeyOptions
  isActive: boolean
  isFullscreen: boolean
  onActivate: () => void
  onCopy?: OnCopyFn
  onPaste?: OnPasteFn
  onToggleFullscreen: () => void
  path: Path
  renderBlockActions?: RenderBlockActionsCallback
  renderCustomMarkers?: RenderCustomMarkers
}

/** @internal */
export type PortableTextEditorElement = HTMLDivElement | HTMLSpanElement | null

/** @internal */
export function Compositor(props: Omit<InputProps, 'schemaType' | 'arrayFunctions'>) {
  const {
    changed,
    focused,
    focusPath = EMPTY_ARRAY,
    hasFocus,
    hotkeys,
    isActive,
    isFullscreen,
    onActivate,
    onChange,
    onCopy,
    onItemClose,
    onItemOpen,
    onItemRemove,
    onPaste,
    onPathFocus,
    onToggleFullscreen,
    path,
    readOnly,
    renderBlockActions,
    renderCustomMarkers,
    renderPreview,
    value,
  } = props

  const editor = usePortableTextEditor()

  const [wrapperElement, setWrapperElement] = useState<HTMLDivElement | null>(null)
  const [boundaryElement, setBoundaryElement] = useState<HTMLElement | null>(null)

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

    [hotkeys, onToggleFullscreen]
  )

  const editorHotkeys = useHotkeys(hotkeysWithFullscreenToggle)

  const _renderBlockActions = !!value && renderBlockActions ? renderBlockActions : undefined
  const _renderCustomMarkers = !!value && renderCustomMarkers ? renderCustomMarkers : undefined

  const initialSelection = useMemo(
    (): EditorSelection => {
      return focusPath.length > 0
        ? {
            anchor: {path: focusPath, offset: 0},
            focus: {path: focusPath, offset: 0},
          }
        : null
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Only initial
  )

  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)

  const renderTextBlock = useCallback(
    (blockProps: BlockRenderProps) => {
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
          boundaryElement={boundaryElement || undefined}
          focused={blockFocused}
          isFullscreen={isFullscreen}
          onChange={onChange}
          onItemClose={onItemClose}
          onItemOpen={onItemOpen}
          onItemRemove={onItemRemove}
          onPathFocus={onPathFocus}
          path={path.concat(blockPath)}
          readOnly={readOnly}
          renderBlockActions={_renderBlockActions}
          renderCustomMarkers={_renderCustomMarkers}
          renderPreview={renderPreview}
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
      onChange,
      onItemClose,
      onItemOpen,
      onItemRemove,
      onPathFocus,
      path,
      readOnly,
      renderPreview,
    ]
  )

  const renderObjectBlock = useCallback(
    (blockProps: BlockRenderProps) => {
      const {
        focused: blockFocused,
        path: blockPath,
        selected: blockSelected,
        schemaType: blockSchemaType,
        value: blockValue,
      } = blockProps
      return (
        <BlockObject
          boundaryElement={boundaryElement || undefined}
          focused={blockFocused}
          isFullscreen={isFullscreen}
          onChange={onChange}
          onItemClose={onItemClose}
          onItemOpen={onItemOpen}
          onItemRemove={onItemRemove}
          onPathFocus={onPathFocus}
          path={path.concat(blockPath)}
          readOnly={readOnly}
          relativePath={blockPath}
          renderBlockActions={_renderBlockActions}
          renderCustomMarkers={_renderCustomMarkers}
          renderPreview={renderPreview}
          schemaType={blockSchemaType}
          selected={blockSelected}
          value={blockValue}
        />
      )
    },
    [
      _renderBlockActions,
      _renderCustomMarkers,
      boundaryElement,
      isFullscreen,
      onChange,
      onItemClose,
      onItemOpen,
      onItemRemove,
      onPathFocus,
      path,
      renderPreview,
      readOnly,
    ]
  )

  const renderBlock = useCallback(
    (blockProps: BlockRenderProps) => {
      const {value: block} = blockProps
      const isTextBlock = block._type === editor.schemaTypes.block.name
      if (isTextBlock) {
        return renderTextBlock(blockProps)
      }
      return renderObjectBlock(blockProps)
    },
    [editor.schemaTypes.block.name, renderObjectBlock, renderTextBlock]
  )

  const renderChild = useCallback(
    (childProps: BlockChildRenderProps) => {
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
          boundaryElement={boundaryElement || undefined}
          focused={childFocused}
          onItemClose={onItemClose}
          onItemOpen={onItemOpen}
          onPathFocus={onPathFocus}
          path={path.concat(childPath)}
          readOnly={readOnly}
          relativePath={childPath}
          renderCustomMarkers={renderCustomMarkers}
          renderPreview={renderPreview}
          schemaType={childSchemaType}
          selected={selected}
          value={child}
        />
      )
    },
    [
      boundaryElement,
      editor.schemaTypes.span.name,
      onItemClose,
      onItemOpen,
      onPathFocus,
      path,
      readOnly,
      renderCustomMarkers,
      renderPreview,
    ]
  )

  const renderAnnotation = useCallback(
    (annotationProps: BlockAnnotationRenderProps) => {
      const {
        children,
        focused: aFocused,
        path: aPath,
        selected,
        schemaType: aSchemaType,
        value: aValue,
      } = annotationProps
      return (
        <Annotation
          boundaryElement={boundaryElement}
          focused={aFocused}
          onItemClose={onItemClose}
          onItemOpen={onItemOpen}
          onPathFocus={onPathFocus}
          path={path.concat(aPath)}
          readOnly={readOnly}
          renderCustomMarkers={renderCustomMarkers}
          schemaType={aSchemaType}
          selected={selected}
          value={aValue}
        >
          {children}
        </Annotation>
      )
    },
    [boundaryElement, onItemClose, onItemOpen, onPathFocus, path, readOnly, renderCustomMarkers]
  )

  const editorNode = useMemo(
    () => (
      <Editor
        hasFocus={hasFocus}
        hotkeys={editorHotkeys}
        initialSelection={initialSelection}
        isActive={isActive}
        isFullscreen={isFullscreen}
        onItemOpen={onItemOpen}
        onCopy={onCopy}
        onPaste={onPaste}
        onToggleFullscreen={handleToggleFullscreen}
        path={path}
        readOnly={readOnly}
        renderAnnotation={renderAnnotation}
        renderBlock={renderBlock}
        renderChild={renderChild}
        setPortalElement={setPortalElement}
        scrollElement={boundaryElement}
        setScrollElement={setBoundaryElement}
      />
    ),

    // Keep only stable ones here!
    [
      editorHotkeys,
      handleToggleFullscreen,
      hasFocus,
      initialSelection,
      isActive,
      isFullscreen,
      onCopy,
      onItemOpen,
      onPaste,
      path,
      readOnly,
      renderAnnotation,
      renderBlock,
      renderChild,
      boundaryElement,
    ]
  )

  const portal = usePortal()
  const portalElements = useMemo(
    () => ({
      collapsed: wrapperElement,
      default: portal.element,
      editor: portalElement,
      expanded: portal.element,
    }),

    [portal.element, portalElement, wrapperElement]
  )

  // Scroll to the DOM element of the "opened" portable text member when relevant.
  useScrollToOpenedMember({
    editorRootPath: path,
    focusPath,
    boundaryElement: boundaryElement || undefined,
    onItemClose,
  })

  return (
    <PortalProvider __unstable_elements={portalElements}>
      <ActivateOnFocus onActivate={onActivate} isOverlayActive={!isActive}>
        <ChangeIndicator
          disabled={isFullscreen}
          hasFocus={Boolean(focused)}
          isChanged={changed}
          path={path}
        >
          <Root data-focused={hasFocus ? '' : undefined} data-read-only={readOnly ? '' : undefined}>
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
