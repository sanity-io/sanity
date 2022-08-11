import React, {useState, useMemo, useCallback} from 'react'
import {
  EditorSelection,
  OnCopyFn,
  OnPasteFn,
  PortableTextBlock,
  PortableTextEditor,
  usePortableTextEditor,
  HotkeyOptions,
  RenderAttributes,
} from '@sanity/portable-text-editor'
import {ObjectSchemaType, Path} from '@sanity/types'
import {
  BoundaryElementProvider,
  Portal,
  PortalProvider,
  Text,
  useBoundaryElement,
  usePortal,
} from '@sanity/ui'
import {ChangeIndicator} from '../../../components/changeIndicators'
import {ArrayOfObjectsInputProps, RenderCustomMarkers} from '../../types'
import {ActivateOnFocus} from '../../components/ActivateOnFocus/ActivateOnFocus'
import {EMPTY_ARRAY} from '../../utils/empty'
import {FormInput} from '../../FormInput'
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

export type PortableTextEditorElement = HTMLDivElement | HTMLSpanElement | null

function isTouchDevice() {
  return (
    (typeof window !== 'undefined' && 'ontouchstart' in window) ||
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)
  )
}

const activateVerb = isTouchDevice() ? 'Tap' : 'Click'

const ACTIVATE_ON_FOCUS_MESSAGE = <Text weight="semibold">{activateVerb} to activate</Text>

export function Compositor(props: InputProps) {
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
    onOpenItem,
    onCloseItem,
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
    hasFocus,
    editorRootPath: path,
    scrollElement,
    onCloseItem,
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

  const ptFeatures = useMemo(() => PortableTextEditor.getPortableTextFeatures(editor), [editor])
  const hasContent = !!value

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
    (
      block: PortableTextBlock,
      blockType: ObjectSchemaType,
      attributes: RenderAttributes,
      defaultRender: (b: PortableTextBlock) => JSX.Element
    ) => {
      const isTextBlock = block._type === ptFeatures.types.block.name
      if (isTextBlock) {
        return (
          <TextBlock
            attributes={attributes}
            block={block}
            isFullscreen={isFullscreen}
            onChange={onChange}
            readOnly={readOnly}
            renderBlockActions={hasContent ? renderBlockActions : undefined}
            renderCustomMarkers={hasContent ? renderCustomMarkers : undefined}
          >
            {defaultRender(block)}
          </TextBlock>
        )
      }

      return (
        <BlockObject
          attributes={attributes}
          block={block}
          isFullscreen={isFullscreen}
          onChange={onChange}
          onOpenItem={onOpenItem}
          readOnly={readOnly}
          renderBlockActions={hasContent ? renderBlockActions : undefined}
          renderCustomMarkers={hasContent ? renderCustomMarkers : undefined}
          renderPreview={renderPreview}
          type={blockType}
        />
      )
    },
    [
      hasContent,
      isFullscreen,
      onChange,
      onOpenItem,
      ptFeatures.types.block.name,
      readOnly,
      renderBlockActions,
      renderCustomMarkers,
      renderPreview,
    ]
  )

  const renderChild = useCallback(
    (child, childType, attributes, defaultRender) => {
      const isSpan = child._type === ptFeatures.types.span.name
      if (isSpan) {
        return defaultRender(child)
      }

      return (
        <InlineObject
          attributes={attributes}
          onOpenItem={onOpenItem}
          readOnly={readOnly}
          renderCustomMarkers={renderCustomMarkers}
          scrollElement={scrollElement}
          type={childType}
          value={child}
          renderPreview={renderPreview}
        />
      )
    },
    [
      onOpenItem,
      ptFeatures.types.span.name,
      readOnly,
      renderCustomMarkers,
      renderPreview,
      scrollElement,
    ]
  )

  const renderAnnotation = useCallback(
    (annotation, annotationType, attributes, defaultRender) => {
      return (
        <Annotation
          attributes={attributes}
          onOpenItem={onOpenItem}
          readOnly={readOnly}
          renderCustomMarkers={renderCustomMarkers}
          scrollElement={scrollElement}
          value={annotation}
          type={annotationType}
        >
          {defaultRender()}
        </Annotation>
      )
    },
    [onOpenItem, readOnly, renderCustomMarkers, scrollElement]
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
        isFullscreen={isFullscreen}
        onOpenItem={onOpenItem}
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
      isFullscreen,
      onCopy,
      onOpenItem,
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
                  onClose={onCloseItem}
                  scrollElement={boundaryElm}
                >
                  <FormInput absolutePath={dMemberItem.node.path} {...(props as any)} />
                </ObjectEditModal>
              )
            })}
          </BoundaryElementProvider>
        </>
      ),
    [boundaryElm, editorNode, openMemberItems, onCloseItem, props]
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

  const editorLayer = useMemo(
    () => (
      <Portal __unstable_name={isFullscreen ? 'expanded' : 'collapsed'}>
        <ExpandedLayer data-fullscreen={isFullscreen ? '' : undefined}>{children}</ExpandedLayer>
      </Portal>
    ),
    [children, isFullscreen]
  )
  return (
    <PortalProvider __unstable_elements={portalElements}>
      <ActivateOnFocus
        message={ACTIVATE_ON_FOCUS_MESSAGE}
        onActivate={onActivate}
        isOverlayActive={!isActive}
      >
        <ChangeIndicator
          disabled={isFullscreen}
          hasFocus={Boolean(focused)}
          isChanged={changed}
          path={path}
        >
          <Root data-focused={hasFocus ? '' : undefined} data-read-only={readOnly ? '' : undefined}>
            <div data-wrapper="" ref={setWrapperElement}>
              {editorLayer}
            </div>
            <div data-border="" />
          </Root>
        </ChangeIndicator>
      </ActivateOnFocus>
    </PortalProvider>
  )
}
