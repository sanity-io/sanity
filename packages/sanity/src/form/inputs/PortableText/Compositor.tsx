import React, {useEffect, useState, useMemo, useCallback} from 'react'
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
import {useScrollToFocusFromOutside} from './hooks/useScrollToFocusFromOutside'
import {usePortableTextMemberItems} from './hooks/usePortableTextMembers'
import {_isBlockType} from './_helpers'

interface InputProps extends ArrayOfObjectsInputProps<PortableTextBlock> {
  hasFocus: boolean
  hotkeys?: HotkeyOptions
  isFullscreen: boolean
  onCopy?: OnCopyFn
  onPaste?: OnPasteFn
  onToggleFullscreen: () => void
  path: Path
  renderBlockActions?: RenderBlockActionsCallback
  renderCustomMarkers?: RenderCustomMarkers
}

export type PortableTextEditorElement = HTMLDivElement | HTMLSpanElement | null

const ACTIVATE_ON_FOCUS_MESSAGE = <Text weight="semibold">Click to activate</Text>

export function Compositor(props: InputProps) {
  const {
    changed,
    focusPath = EMPTY_ARRAY,
    focused,
    hasFocus,
    hotkeys,
    isFullscreen,
    onChange,
    onCopy,
    onOpenItem,
    onCloseItem,
    onFocusPath,
    onPaste,
    onToggleFullscreen,
    path,
    renderBlockActions,
    renderCustomMarkers,
    value,
    readOnly,
    renderPreview,
    // ...restProps
  } = props

  const editor = usePortableTextEditor()

  const [isActive, setIsActive] = useState(false)
  const [wrapperElement, setWrapperElement] = useState<HTMLDivElement | null>(null)
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null)
  const portableTextMemberItems = usePortableTextMemberItems()

  const {element: boundaryElement} = useBoundaryElement()

  // This will scroll to the relevant content according to the focusPath set
  useScrollToFocusFromOutside({
    fieldPath: path,
    onCloseItem,
    scrollElement,
  })

  // Set as active whenever we have focus inside the editor.
  useEffect(() => {
    if (hasFocus || focusPath.length > 1) {
      setIsActive(true)
    }
  }, [hasFocus, focusPath])

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

  const focus = useCallback((): void => {
    PortableTextEditor.focus(editor)
  }, [editor])

  const handleActivate = useCallback((): void => {
    if (!isActive) {
      setIsActive(true)
      focus()
    }
  }, [focus, isActive])

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
        onFocusPath={onFocusPath}
        onCopy={onCopy}
        onPaste={onPaste}
        onToggleFullscreen={handleToggleFullscreen}
        path={path}
        readOnly={isActive === false || readOnly}
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
      onOpenItem,
      onFocusPath,
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
  return (
    <PortalProvider __unstable_elements={portalElements}>
      <ActivateOnFocus
        message={ACTIVATE_ON_FOCUS_MESSAGE}
        onActivate={handleActivate}
        isOverlayActive={!isActive}
      >
        <ChangeIndicator
          disabled={isFullscreen}
          hasFocus={!!focused}
          isChanged={changed}
          path={path}
        >
          <Root data-focused={hasFocus ? '' : undefined} data-read-only={readOnly ? '' : undefined}>
            <div data-wrapper="" ref={setWrapperElement}>
              <Portal __unstable_name={isFullscreen ? 'expanded' : 'collapsed'}>
                {/* TODO: Can we get rid of this DOM-rerender? */}
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
