import React, {useState, useMemo, useCallback} from 'react'
import {
  EditorSelection,
  OnCopyFn,
  OnPasteFn,
  usePortableTextEditor,
  HotkeyOptions,
  RenderPortableTextBlockProps,
  RenderPortableTextChildProps,
  RenderAnnotationProps,
} from '@sanity/portable-text-editor'
import {Path, PortableTextBlock, PortableTextTextBlock} from '@sanity/types'
import {
  BoundaryElementProvider,
  Portal,
  PortalProvider,
  useBoundaryElement,
  usePortal,
} from '@sanity/ui'
import {ArrayOfObjectsInputProps, RenderCustomMarkers} from '../../types'
import {FormInput} from '../../components'
import {ActivateOnFocus} from '../../components/ActivateOnFocus/ActivateOnFocus'
import {EMPTY_ARRAY} from '../../../util'
import {FIXME} from '../../../FIXME'
import {ChangeIndicator} from '../../../changeIndicators'
import {BlockObject} from './object/BlockObject'
import {InlineObject} from './object/InlineObject'
import {Annotation, TextBlock} from './text'
import {RenderBlockActionsCallback} from './types'
import {Editor} from './Editor'
import {ExpandedLayer, Root} from './Compositor.styles'
import {useHotkeys} from './hooks/useHotKeys'
import {ObjectEditModal} from './object/renderers/ObjectEditModal'
import {useScrollToOpenedMember} from './hooks/useScrollToOpenedMember'
import {usePortableTextMemberItems} from './hooks/usePortableTextMembers'
import {_isBlockType} from './_helpers'

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
    focusPath = EMPTY_ARRAY,
    focused,
    hasFocus,
    hotkeys,
    isActive,
    isFullscreen,
    onChange,
    onCopy,
    onActivate,
    onItemOpen,
    onItemClose,
    onPaste,
    onToggleFullscreen,
    path,
    renderBlockActions,
    renderCustomMarkers,
    value,
    readOnly,
    renderPreview,
  } = props

  const editor = usePortableTextEditor()

  const [wrapperElement, setWrapperElement] = useState<HTMLDivElement | null>(null)
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null)
  const portableTextMemberItems = usePortableTextMemberItems()

  const {element: boundaryElement} = useBoundaryElement()

  // Scroll to the DOM element of the "opened" portable text member when relevant.
  useScrollToOpenedMember({
    hasFormFocus: focusPath.length > 0,
    editorRootPath: path,
    scrollElement,
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
    (): EditorSelection =>
      focusPath.length > 0
        ? {
            anchor: {path: focusPath, offset: 0},
            focus: {path: focusPath, offset: 0},
          }
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Only initial
  )

  const renderBlock = useCallback(
    (blockProps: RenderPortableTextBlockProps) => {
      const {value: block, type: blockType, attributes, defaultRender} = blockProps
      const isTextBlock = block._type === editor.types.block.name
      if (isTextBlock) {
        return (
          <TextBlock
            attributes={attributes}
            block={block as PortableTextTextBlock}
            isFullscreen={isFullscreen}
            onChange={onChange}
            readOnly={readOnly}
            renderBlockActions={_renderBlockActions}
            renderCustomMarkers={_renderCustomMarkers}
          >
            {defaultRender(blockProps)}
          </TextBlock>
        )
      }

      return (
        <BlockObject
          attributes={attributes}
          block={block}
          isFullscreen={isFullscreen}
          onChange={onChange}
          onItemOpen={onItemOpen}
          readOnly={readOnly}
          renderBlockActions={_renderBlockActions}
          renderCustomMarkers={_renderCustomMarkers}
          renderPreview={renderPreview}
          type={blockType}
        />
      )
    },
    [
      _renderBlockActions,
      _renderCustomMarkers,
      editor.types.block.name,
      isFullscreen,
      onChange,
      onItemOpen,
      readOnly,
      renderPreview,
    ]
  )

  const renderChild = useCallback(
    (childProps: RenderPortableTextChildProps) => {
      const {value: child, type: childType, attributes, defaultRender} = childProps
      const isSpan = child._type === editor.types.span.name
      if (isSpan) {
        return defaultRender(childProps)
      }

      return (
        <InlineObject
          attributes={attributes}
          onItemOpen={onItemOpen}
          readOnly={readOnly}
          renderCustomMarkers={renderCustomMarkers}
          scrollElement={scrollElement}
          type={childType}
          value={child}
          renderPreview={renderPreview}
        />
      )
    },
    [editor, onItemOpen, readOnly, renderCustomMarkers, renderPreview, scrollElement]
  )

  const renderAnnotation = useCallback(
    (annotationProps: RenderAnnotationProps) => {
      const {value: aValue, type, attributes, defaultRender} = annotationProps
      const CustomComponent = 'components' in type && type.components?.item
      const rendered = defaultRender(annotationProps)
      return (
        <Annotation
          attributes={attributes}
          onItemOpen={onItemOpen}
          readOnly={readOnly}
          renderCustomMarkers={renderCustomMarkers}
          scrollElement={scrollElement}
          value={aValue}
          type={type}
        >
          {CustomComponent ? (
            // eslint-disable-next-line react/jsx-no-bind
            <CustomComponent {...annotationProps} defaultRender={() => rendered} />
          ) : (
            rendered
          )}
        </Annotation>
      )
    },
    [onItemOpen, readOnly, renderCustomMarkers, scrollElement]
  )

  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)

  const openMemberItems = useMemo(
    () => portableTextMemberItems.filter((m) => m.member.open && !_isBlockType(m.node.schemaType)),
    [portableTextMemberItems]
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
        scrollElement={scrollElement}
        setScrollElement={setScrollElement}
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
      scrollElement,
    ]
  )

  const boundaryElm = isFullscreen ? scrollElement : boundaryElement

  const handleEditModalClose = useCallback(() => {
    onItemClose()
  }, [onItemClose])

  const children = useMemo(
    () =>
      boundaryElm && (
        <>
          {editorNode}
          <BoundaryElementProvider element={boundaryElm}>
            {openMemberItems.map((dMemberItem) => {
              return (
                <ObjectEditModal
                  kind={dMemberItem.kind}
                  key={dMemberItem.member.key}
                  memberItem={dMemberItem}
                  onClose={handleEditModalClose}
                  scrollElement={boundaryElm}
                >
                  <FormInput absolutePath={dMemberItem.node.path} {...(props as FIXME)} />
                </ObjectEditModal>
              )
            })}
          </BoundaryElementProvider>
        </>
      ),
    [boundaryElm, editorNode, openMemberItems, props, handleEditModalClose]
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
    <PortalProvider __unstable_elements={portalElements}>
      <ActivateOnFocus onActivate={onActivate} isOverlayActive={!isActive}>
        <ChangeIndicator
          disabled={isFullscreen}
          hasFocus={Boolean(focused)}
          isChanged={changed}
          path={path}
        >
          <Root data-focused={hasFocus ? '' : undefined} data-read-only={readOnly ? '' : undefined}>
            <div data-wrapper="" ref={setWrapperElement}>
              <Portal __unstable_name={isFullscreen ? 'expanded' : 'collapsed'}>
                {isFullscreen ? <ExpandedLayer>{children}</ExpandedLayer> : children}
              </Portal>
            </div>
            <div data-border="" />
          </Root>
        </ChangeIndicator>
      </ActivateOnFocus>
    </PortalProvider>
  )
}
