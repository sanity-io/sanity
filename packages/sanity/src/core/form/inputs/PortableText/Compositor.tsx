import {
  type BlockAnnotationRenderProps,
  type BlockObjectRenderProps,
  defineBlockObject,
  defineInlineObject,
  defineTextBlock,
  type EditorSelection,
  type HotkeyOptions,
  type InlineObjectRenderProps,
  type OnCopyFn,
  type OnPasteFn as EditorOnPasteFn,
  type PasteData as EditorPasteData,
  type RangeDecoration,
  type RegistrableNode,
  type TextBlockRenderProps,
  useEditor,
} from '@portabletext/editor'
import {NodePlugin} from '@portabletext/editor/plugins'
import {DndProvider, useDropPosition} from '@portabletext/plugin-dnd'
import {ListIndexProvider, useListIndex} from '@portabletext/plugin-list-index'
import {getSanitySubSchema} from '@portabletext/sanity-bridge'
import {type Path, type PortableTextBlock, type PortableTextTextBlock} from '@sanity/types'
import {
  BoundaryElementProvider,
  Box,
  Portal,
  PortalProvider,
  useBoundaryElement,
  usePortal,
} from '@sanity/ui'
import {type ReactNode, useCallback, useMemo, useState} from 'react'

import {ChangeIndicator} from '../../../changeIndicators'
import {EMPTY_ARRAY} from '../../../util'
import {ActivateOnFocus} from '../../components/ActivateOnFocus/ActivateOnFocus'
import {type ArrayOfObjectsInputProps, type RenderCustomMarkers} from '../../types'
import {type RenderBlockActionsCallback} from '../../types/_transitional'
import {type OnPasteFn} from '../../types/inputProps'
import {pathToAnchorIdent} from '../../utils/pathToAnchorIdent'
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
import {ListItem} from './text/ListItem'
import {Style} from './text/Style'

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
  const editor = useEditor()

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
  const floatingBoundary = isFullscreen ? scrollElement : boundaryElement

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
    (textBlockProps: TextBlockRenderProps) => {
      const {attributes, focused: blockFocused, node, path: blockPath, selected} = textBlockProps
      const block = node
      const fullyQualifiedPath = path.concat(blockPath)
      let inner = textBlockProps.children
      if (block.style !== undefined) {
        inner = (
          <Style block={block} focused={blockFocused} selected={selected}>
            {inner}
          </Style>
        )
      }
      if (block.listItem !== undefined) {
        inner = (
          <ListItem block={block} focused={blockFocused} selected={selected}>
            {inner}
          </ListItem>
        )
      }

      return (
        <TextBlockShell attributes={attributes} block={block} path={blockPath}>
          <BlockDropIndicator path={blockPath} edge="start" />
          <TextBlock
            floatingBoundary={floatingBoundary}
            focused={blockFocused}
            isFullscreen={isFullscreen}
            onItemClose={onItemClose}
            onItemOpen={onItemOpen}
            onItemRemove={onItemRemove}
            onPathFocus={onPathFocus}
            path={fullyQualifiedPath}
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
            value={block}
            anchorIdent={pathToAnchorIdent('input', fullyQualifiedPath)}
            relativePath={blockPath}
          >
            {inner}
          </TextBlock>
          <BlockDropIndicator path={blockPath} edge="end" />
        </TextBlockShell>
      )
    },
    [
      _renderBlockActions,
      _renderCustomMarkers,
      floatingBoundary,
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

  const renderBlockObject = useCallback(
    (blockProps: BlockObjectRenderProps) => {
      const {attributes, focused: blockFocused, node, path: blockPath, selected} = blockProps
      const sanitySchemaType = getSanitySubSchema(
        schemaTypes.portableText,
        editor.getSnapshot().context.value,
        blockPath,
      ).blockObjects.find((t) => t.name === node._type)
      if (!sanitySchemaType) {
        // `getSanitySubSchema` returned the sub-schema at this path, but no
        // block-object type in it matches `node._type`.
        throw new Error(`Could not find Sanity schema type for block object: ${node._type}`)
      }
      return (
        <div {...attributes}>
          <BlockDropIndicator path={blockPath} edge="start" />
          {blockProps.children}
          <div contentEditable={false} draggable={!readOnly}>
            <BlockObject
              floatingBoundary={floatingBoundary}
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
              selected={selected}
              setElementRef={setElementRef}
              value={node}
            />
          </div>
          <BlockDropIndicator path={blockPath} edge="end" />
        </div>
      )
    },
    [
      floatingBoundary,
      scrollElement,
      schemaTypes.portableText,
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
      editor,
    ],
  )

  const renderInlineObject = useCallback(
    (childProps: InlineObjectRenderProps) => {
      const {attributes, focused: childFocused, node, path: childPath, selected} = childProps
      const sanitySchemaType = getSanitySubSchema(
        schemaTypes.portableText,
        editor.getSnapshot().context.value,
        childPath,
      ).inlineObjects.find((t) => t.name === node._type)
      if (!sanitySchemaType) {
        // `getSanitySubSchema` returned the sub-schema at this path, but no
        // inline-object type in it matches `node._type`.
        throw new Error(`Could not find Sanity schema type for inline object: ${node._type}`)
      }
      return (
        <span {...attributes}>
          {childProps.children}
          <span draggable={!readOnly} style={{display: 'inline-block'}}>
            <InlineObject
              floatingBoundary={floatingBoundary}
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
              value={node}
            />
          </span>
        </span>
      )
    },
    [
      schemaTypes.portableText,
      floatingBoundary,
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
      editor,
    ],
  )

  // Stable reference: `NodePlugin` re-runs its registration effect when
  // `nodes` changes by reference.
  const catchAllNodes = useMemo<RegistrableNode[]>(
    () => [
      defineTextBlock({type: '*', render: renderTextBlock}),
      defineBlockObject({type: '*', render: renderBlockObject}),
      defineInlineObject({type: '*', render: renderInlineObject}),
    ],
    [renderTextBlock, renderBlockObject, renderInlineObject],
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
      const annotationPath = [...aPath.slice(0, -2), 'markDefs', {_key: aValue._key}]
      const sanitySchemaType = getSanitySubSchema(
        schemaTypes.portableText,
        editor.getSnapshot().context.value,
        annotationPath,
      ).annotations.find((t) => t.name === aSchemaType.name)
      if (!sanitySchemaType) {
        // This should never happen
        throw new Error(`Could not find Sanity schema type for annotation: ${aSchemaType.name}`)
      }
      return (
        <Annotation
          editorNodeFocused={editorNodeFocused}
          floatingBoundary={floatingBoundary}
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
      schemaTypes.portableText,
      floatingBoundary,
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
      editor,
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
    ptInputPath: path,
    boundaryElement: scrollElement,
    onItemClose,
  })

  // The editor should have a focus ring when the field itself is focused,
  // or focus is pointing directly to a node inside the editor
  // (as opposed to focus on fields inside object nodes like annotations, inline blocks etc.)
  const editorFocused = focused || hasFocusWithin

  return (
    <SelectedAnnotationsProvider>
      <DndProvider>
        <ListIndexProvider>
          <NodePlugin nodes={catchAllNodes} />
          <PortalProvider __unstable_elements={portalElements} element={portal.element}>
            <BoundaryElementProvider element={floatingBoundary}>
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
                        <CombinedAnnotationPopover referenceBoundary={scrollElement} />
                      </Portal>
                    </Box>
                    <div data-border="" />
                  </Root>
                </ChangeIndicator>
              </ActivateOnFocus>
            </BoundaryElementProvider>
          </PortalProvider>
        </ListIndexProvider>
      </DndProvider>
    </SelectedAnnotationsProvider>
  )
}

function DropIndicator() {
  return (
    <div
      className="pt-drop-indicator"
      contentEditable={false}
      style={{
        position: 'absolute',
        width: '100%',
        height: 1,
        borderBottom: '1px solid currentColor',
        zIndex: 5,
      }}
    >
      <span />
    </div>
  )
}

function BlockDropIndicator(props: {path: Path; edge: 'start' | 'end'}) {
  const dropPosition = useDropPosition(props.path)
  return dropPosition === props.edge ? <DropIndicator /> : null
}

// Reproduces the list classes and `data-level`/`data-list-index` the engine's
// own text-block render emits: Studio's CSS keys ordered-list numbering off
// `[data-level][data-list-index]` and inter-item spacing off `.pt-list-item*`.
// `data-list-index` comes from `useListIndex`; the new pipeline doesn't expose
// the engine's list-index map.
function TextBlockShell(props: {
  attributes: TextBlockRenderProps['attributes']
  block: PortableTextTextBlock
  children: ReactNode
  path: Path
}) {
  const {attributes, block, children, path: blockPath} = props
  const listIndex = useListIndex(blockPath)
  // `level` is optional even on list items; default it to 1 so `data-level` is
  // always present for `Editor.styles`' `[data-level][data-list-index]`
  // ordered-list counter.
  const level = block.listItem !== undefined ? (block.level ?? 1) : block.level
  return (
    <div
      {...attributes}
      className={
        block.listItem !== undefined ? `pt-list-item pt-list-item-${block.listItem}` : undefined
      }
      {...(level !== undefined ? {'data-level': level} : {})}
      {...(listIndex !== undefined ? {'data-list-index': listIndex} : {})}
    >
      {children}
    </div>
  )
}
