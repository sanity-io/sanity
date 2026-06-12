import {
  type BlockAnnotationRenderProps,
  defineBlockObject,
  defineInlineObject,
  defineTextBlock,
  type EditorSelection,
  type HotkeyOptions,
  type OnCopyFn,
  type OnPasteFn as EditorOnPasteFn,
  type PasteData as EditorPasteData,
  type Path as EditorPath,
  type RangeDecoration,
  type RegistrableNode,
} from '@portabletext/editor'
import {NodePlugin} from '@portabletext/editor/plugins'
import {useListIndex} from '@portabletext/plugin-list-index'
import {
  type ObjectSchemaType,
  type Path,
  type PortableTextBlock,
  type PortableTextTextBlock,
} from '@sanity/types'
import {
  BoundaryElementProvider,
  Box,
  Portal,
  PortalProvider,
  useBoundaryElement,
  usePortal,
} from '@sanity/ui'
import {type ComponentProps, type ReactNode, useCallback, useMemo, useState} from 'react'

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

// PTE 7.2.0 exports the `defineX` factories but does not re-export the
// render-props types from its public surface. Derive them by inference
// from the factory parameter shape.
type BlockObjectRenderProps = Parameters<
  NonNullable<Parameters<typeof defineBlockObject>[0]['render']>
>[0]
type InlineObjectRenderProps = Parameters<
  NonNullable<Parameters<typeof defineInlineObject>[0]['render']>
>[0]
type TextBlockRenderProps = Parameters<
  NonNullable<Parameters<typeof defineTextBlock>[0]['render']>
>[0]

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

  // Catch-all text block render: handles any `_type` not registered
  // by a more-specific `defineTextBlock` upstream. Plays the role of
  // the legacy `renderBlock` callback's text-block branch + folds in
  // the legacy `renderStyle` and `renderListItem` wrapping that PTE
  // used to apply before invoking `renderBlock` for text blocks.
  const renderTextBlock = useCallback(
    (textBlockProps: TextBlockRenderProps) => {
      const {attributes, focused: blockFocused, node, path: blockPath, selected} = textBlockProps
      const block = node as PortableTextTextBlock
      const fullyQualifiedPath = path.concat(blockPath)

      // Reproduce engine-default Style + ListItem wrapping around the
      // editable children. PTE used to do this in its default text-block
      // render before invoking `renderBlock`; under `defineTextBlock`
      // override the engine no longer applies it, so the consumer
      // override owns the wrapping. Studio's `<Style>` and `<ListItem>`
      // look up the Sanity-flavoured schema type via context and only
      // read `schemaType.value` from the engine prop, so the synthesized
      // shape works.
      // Render style and list-item wrappers using Studio's existing
      // components. They read only `schemaType.value` from the engine
      // prop (looking up the Sanity schema via context), so the
      // synthesized `BlockStyleRenderProps` / `BlockListItemRenderProps`
      // shape is safe.
      let inner = textBlockProps.children
      if (block.style !== undefined) {
        inner = (
          <Style
            {...({
              block,
              children: inner,
              focused: blockFocused,
              path: fullyQualifiedPath,
              schemaType: {value: block.style, name: block.style, title: block.style},
              selected,
              value: block.style,
            } as ComponentProps<typeof Style>)}
          />
        )
      }
      if (block.listItem !== undefined) {
        inner = (
          <ListItem
            {...({
              block,
              children: inner,
              focused: blockFocused,
              level: block.level ?? 1,
              path: fullyQualifiedPath,
              schemaType: {value: block.listItem, name: block.listItem, title: block.listItem},
              selected,
              value: block.listItem,
            } as ComponentProps<typeof ListItem>)}
          />
        )
      }

      return (
        <TextBlockRoot attributes={attributes} block={block} blockPath={blockPath}>
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
          >
            {inner}
          </TextBlock>
        </TextBlockRoot>
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

  // Catch-all block-object render: handles any non-text block whose
  // `_type` isn't registered upstream. Plays the role of the legacy
  // `renderBlock` callback's object-block branch.
  const renderBlockObject = useCallback(
    (blockProps: BlockObjectRenderProps) => {
      const {attributes, focused: blockFocused, node, path: blockPath, selected} = blockProps
      const sanitySchemaType: ObjectSchemaType | undefined = schemaTypes.blockObjects.find(
        (type) => type.name === node._type,
      )
      if (!sanitySchemaType) {
        // No matching Sanity schema type: fall back to the engine
        // default. Happens when a container plugin registers a block
        // object whose `_type` is not present at the PT array's top
        // level (the only depth this enumeration covers).
        return blockProps.renderDefault(blockProps)
      }
      return (
        // Reproduce the legacy pipeline's attribute surface; the new
        // pipeline strips `data-slate-node`/`data-slate-void` at the
        // element level and consumers re-add them for backwards
        // compatibility.
        <div
          {...attributes}
          data-block-key={node._key}
          data-block-name={node._type}
          data-block-type="object"
          data-slate-node="element"
          data-slate-void
        >
          {blockProps.children}
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
      schemaTypes.blockObjects,
      scrollElement,
      setElementRef,
    ],
  )

  // Catch-all inline-object render: handles any inline object whose
  // `_type` isn't registered upstream. Plays the role of the legacy
  // `renderChild` callback's inline-object branch.
  const renderInlineObject = useCallback(
    (childProps: InlineObjectRenderProps) => {
      const {attributes, focused: childFocused, node, path: childPath, selected} = childProps
      const sanitySchemaType: ObjectSchemaType | undefined = schemaTypes.inlineObjects.find(
        (type) => type.name === node._type,
      )
      if (!sanitySchemaType) {
        // Same fallback as block objects: container-nested inline
        // objects fall through to the engine default until the form-
        // store walker catches up.
        return childProps.renderDefault(childProps)
      }
      return (
        // Same backwards-compatibility attribute surface as block objects,
        // with the inline (`data-child-*`) naming.
        <span
          {...attributes}
          data-child-key={node._key}
          data-child-name={node._type}
          data-child-type="object"
          data-slate-node="element"
          data-slate-void
        >
          {childProps.children}
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
      )
    },
    [
      floatingBoundary,
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
      schemaTypes.inlineObjects,
      scrollElement,
      setElementRef,
    ],
  )

  // Three catch-all node registrations mounted via <NodePlugin> below.
  // Stable array reference: NodePlugin re-runs its registration effect
  // whenever `nodes` changes by reference.
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
      schemaTypes.annotations,
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
    boundaryElement: scrollElement,
    onItemClose,
  })

  // The editor should have a focus ring when the field itself is focused,
  // or focus is pointing directly to a node inside the editor
  // (as opposed to focus on fields inside object nodes like annotations, inline blocks etc.)
  const editorFocused = focused || hasFocusWithin

  return (
    <SelectedAnnotationsProvider>
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
    </SelectedAnnotationsProvider>
  )
}

/**
 * Root element for the catch-all text-block render. A component rather than
 * inline JSX because `useListIndex` is a hook and the engine invokes the
 * registered render as a plain function: hooks belong in a component the
 * render returns.
 *
 * Reproduces the full class and data-attribute surface the legacy pipeline
 * emitted on text blocks. Consumers target these in CSS and tests, and the
 * unified input manager's slow path reads `data-block-key` and
 * `data-block-type` to diff the DOM after IME composition, so this is
 * load-bearing, not cosmetic. `data-list-index` is served by
 * `@portabletext/plugin-list-index` (mounted in `Editor.tsx`).
 */
function TextBlockRoot(props: {
  attributes: Record<string, unknown>
  block: PortableTextTextBlock
  blockPath: EditorPath
  children: ReactNode
}) {
  const listIndex = useListIndex(props.blockPath)
  const {block} = props

  return (
    <div
      {...props.attributes}
      className={[
        'pt-block',
        'pt-text-block',
        ...(block.style ? [`pt-text-block-style-${block.style}`] : []),
        ...(block.listItem
          ? [
              'pt-list-item',
              `pt-list-item-${block.listItem}`,
              `pt-list-item-level-${block.level ?? 1}`,
            ]
          : []),
      ].join(' ')}
      data-block-key={block._key}
      data-block-name={block._type}
      data-block-type="text"
      data-slate-node="element"
      {...(block.listItem === undefined ? {} : {'data-list-item': block.listItem})}
      {...(block.level === undefined ? {} : {'data-level': block.level})}
      {...(block.style === undefined ? {} : {'data-style': block.style})}
      {...(listIndex === undefined ? {} : {'data-list-index': listIndex})}
    >
      {props.children}
    </div>
  )
}
