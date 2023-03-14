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
import {Portal, PortalProvider, usePortal} from '@sanity/ui'
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

  // Scroll to the DOM element of the "opened" portable text member when relevant.
  useScrollToOpenedMember({
    hasFormFocus: focusPath.length > 0,
    editorRootPath: path,
    boundaryElement: undefined,
    onItemClose,
  })

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
  // const boundaryElm = isFullscreen ? scrollElement : boundaryElement

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
          block={block as PortableTextTextBlock}
          focused={blockFocused}
          isFullscreen={isFullscreen}
          onChange={onChange}
          path={blockPath}
          readOnly={readOnly}
          renderBlockActions={_renderBlockActions}
          renderCustomMarkers={_renderCustomMarkers}
          selected={selected}
          schemaType={blockSchemaType}
        >
          {children}
        </TextBlock>
      )
    },
    [_renderBlockActions, _renderCustomMarkers, isFullscreen, onChange, readOnly]
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
          focused={blockFocused}
          isFullscreen={isFullscreen}
          onChange={onChange}
          onItemOpen={onItemOpen}
          onItemClose={onItemClose}
          onItemRemove={onItemRemove}
          onPathFocus={onPathFocus}
          path={blockPath}
          readOnly={readOnly}
          renderPreview={renderPreview}
          renderBlockActions={_renderBlockActions}
          renderCustomMarkers={_renderCustomMarkers}
          boundaryElement={boundaryElement || undefined}
          selected={blockSelected}
          schemaType={blockSchemaType}
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
          focused={childFocused}
          onPathFocus={props.onPathFocus}
          onItemClose={props.onItemClose}
          onItemOpen={props.onItemOpen}
          path={childPath}
          readOnly={readOnly}
          renderCustomMarkers={renderCustomMarkers}
          renderPreview={props.renderPreview}
          boundaryElement={boundaryElement || undefined}
          selected={selected}
          schemaType={childSchemaType}
          value={child}
        />
      )
    },
    [
      editor.schemaTypes.span.name,
      props.onPathFocus,
      props.onItemClose,
      props.onItemOpen,
      props.renderPreview,
      readOnly,
      renderCustomMarkers,
      boundaryElement,
    ]
  )

  const renderAnnotation = useCallback(
    (annotationProps: BlockAnnotationRenderProps) => {
      return (
        <Annotation
          renderProps={annotationProps}
          onItemOpen={onItemOpen}
          onItemClose={onItemClose}
          readOnly={readOnly}
          renderCustomMarkers={renderCustomMarkers}
          scrollElement={boundaryElement}
        />
      )
    },
    [onItemOpen, onItemClose, readOnly, renderCustomMarkers, boundaryElement]
  )

  const editorNode = useMemo(
    () => (
      <Editor
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

  return (
    <>
      <PortalProvider __unstable_elements={portalElements}>
        <ActivateOnFocus onActivate={onActivate} isOverlayActive={!isActive}>
          <ChangeIndicator
            disabled={isFullscreen}
            hasFocus={Boolean(focused)}
            isChanged={changed}
            path={path}
          >
            <Root
              data-focused={hasFocus ? '' : undefined}
              data-read-only={readOnly ? '' : undefined}
            >
              <div data-wrapper="" ref={setWrapperElement}>
                <Portal __unstable_name={isFullscreen ? 'expanded' : 'collapsed'}>
                  {isFullscreen ? <ExpandedLayer>{editorNode}</ExpandedLayer> : editorNode}
                </Portal>
              </div>
              <div data-border="" />
            </Root>
          </ChangeIndicator>
        </ActivateOnFocus>
      </PortalProvider>
    </>
  )
}
