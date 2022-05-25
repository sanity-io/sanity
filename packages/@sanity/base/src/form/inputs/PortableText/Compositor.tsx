import React, {useEffect, useState, useMemo, useCallback, createRef} from 'react'
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
import {
  isKeySegment,
  isValidationErrorMarker,
  isValidationWarningMarker,
  ObjectSchemaType,
  Path,
} from '@sanity/types'
import {
  BoundaryElementProvider,
  Portal,
  PortalProvider,
  Text,
  useBoundaryElement,
  usePortal,
} from '@sanity/ui'
import {ChangeIndicatorWithProvidedFullPath} from '../../../components/changeIndicators'
import {ArrayOfObjectsInputProps, FIXME, PortableTextMarker, RenderCustomMarkers} from '../../types'
import {ActivateOnFocus} from '../../components/ActivateOnFocus/ActivateOnFocus'
import {EMPTY_ARRAY} from '../../utils/empty'
import {FormInput} from '../../FormInput'
import {BlockObject} from './object/BlockObject'
import {InlineObject} from './object/InlineObject'
import {Annotation, TextBlock} from './text'
import {RenderBlockActionsCallback} from './types'
import {Editor} from './Editor'
import {ExpandedLayer, Root} from './Compositor.styles'
import {useScrollSelectionIntoView} from './hooks/useScrollSelectionIntoView'
import {useHotkeys} from './hooks/useHotKeys'
import {ObjectEditModal} from './ObjectEditModal'
import {useScrollToFocusFromOutside} from './hooks/useScrollToFocusFromOutside'
import {ObjectMemberType} from './PortableTextInput'

interface InputProps extends ArrayOfObjectsInputProps<PortableTextBlock> {
  hasFocus: boolean
  hotkeys?: HotkeyOptions
  isFullscreen: boolean
  markers: PortableTextMarker[]
  members: ObjectMemberType[]
  onCollapse: (path: Path) => void
  onCopy?: OnCopyFn
  onExpand: (path: Path) => void
  onPaste?: OnPasteFn
  onToggleFullscreen: () => void
  portableTextMembers: ObjectMemberType[]
  renderBlockActions?: RenderBlockActionsCallback
  renderCustomMarkers?: RenderCustomMarkers
}

export type EditorElement = HTMLDivElement | HTMLSpanElement | null

export type EditorElementWeakMap = WeakMap<Path, React.MutableRefObject<EditorElement>>

const ACTIVATE_ON_FOCUS_MESSAGE = <Text weight="semibold">Click to activate</Text>

export function Compositor(props: InputProps) {
  const {
    focusPath = EMPTY_ARRAY,
    hasFocus,
    hotkeys,
    isFullscreen,
    markers,
    onChange,
    onCollapse,
    onCopy,
    onExpand,
    onFocusPath,
    onPaste,
    onToggleFullscreen,
    portableTextMembers,
    renderBlockActions,
    renderCustomMarkers,
    validation,
    value,
    readOnly,
    renderPreview,
    // ...restProps
  } = props

  const editor = usePortableTextEditor()

  const [isActive, setIsActive] = useState(false)
  const [wrapperElement, setWrapperElement] = useState<HTMLDivElement | null>(null)
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null)

  const collapsedObjectMembers = useMemo(
    () =>
      portableTextMembers.filter(
        (m) => m.collapsed === false && m.item.schemaType.name !== 'block'
      ),
    [portableTextMembers]
  )

  const {element: boundaryElement} = useBoundaryElement()

  const elementRefs = useMemo(() => new WeakMap<Path, React.MutableRefObject<EditorElement>>(), [])

  // This is what PortableTextEditor will use to scroll the content into view when editing
  // inside the editor
  const scrollSelectionIntoView = useScrollSelectionIntoView(scrollElement)

  // This will scroll to the relevant content according to the focusPath set
  useScrollToFocusFromOutside({
    elementRefs,
    portableTextMembers,
    focusPath,
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
      const member = portableTextMembers.find((m) => m.key === block._key)
      const elmRef = member ? setMemberElementRef(member.item.path, elementRefs) : undefined

      const isTextBlock = block._type === ptFeatures.types.block.name
      const blockMarkers = markers.filter(
        (msg) =>
          isKeySegment(msg.path[1]) && msg.path[1]._key === block._key && msg.path.length === 2
      )

      const blockValidation = validation.filter(
        (msg) => isKeySegment(msg.path[1]) && msg.path[1]._key === block._key
      )

      if (isTextBlock) {
        return (
          <TextBlock
            attributes={attributes}
            block={block}
            blockRef={elmRef}
            isFullscreen={isFullscreen}
            markers={blockMarkers}
            validation={blockValidation}
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
          blockRef={elmRef}
          editor={editor}
          isFullscreen={isFullscreen}
          markers={blockMarkers}
          onChange={onChange}
          onCollapse={onCollapse}
          onExpand={onExpand}
          onFocus={onFocusPath}
          readOnly={readOnly}
          renderBlockActions={hasContent ? renderBlockActions : undefined}
          renderCustomMarkers={hasContent ? renderCustomMarkers : undefined}
          renderPreview={renderPreview}
          type={blockType}
          validation={blockValidation}
        />
      )
    },
    [
      editor,
      elementRefs,
      hasContent,
      isFullscreen,
      markers,
      portableTextMembers,
      onChange,
      onCollapse,
      onExpand,
      onFocusPath,
      ptFeatures.types.block.name,
      readOnly,
      renderBlockActions,
      renderCustomMarkers,
      renderPreview,
      validation,
    ]
  )

  const renderChild = useCallback(
    (child, childType, attributes, defaultRender) => {
      const isSpan = child._type === ptFeatures.types.span.name

      if (isSpan) {
        return <span>{defaultRender(child)}</span>
      }

      const childMarkers = markers.filter(
        (marker) => isKeySegment(marker.path[3]) && marker.path[3]._key === child._key
      )

      const childValidation = validation.filter(
        (marker) => isKeySegment(marker.path[3]) && marker.path[3]._key === child._key
      )

      const member = portableTextMembers.find((m) => m.key === child._key)
      const elmRef = member ? setMemberElementRef(member.item.path, elementRefs) : undefined

      return (
        <InlineObject
          attributes={attributes}
          isEditing={Boolean(member && member.collapsed === false)}
          markers={childMarkers}
          validation={childValidation}
          onExpand={onExpand}
          readOnly={readOnly}
          ref={elmRef}
          renderCustomMarkers={renderCustomMarkers}
          scrollElement={scrollElement}
          type={childType}
          value={child}
          renderPreview={renderPreview}
        />
      )
    },
    [
      elementRefs,
      markers,
      portableTextMembers,
      onExpand,
      ptFeatures.types.span.name,
      readOnly,
      renderCustomMarkers,
      renderPreview,
      scrollElement,
      validation,
    ]
  )

  const renderAnnotation = useCallback(
    (annotation, annotationType, attributes, defaultRender) => {
      const annotationMarkers = markers.filter(
        (marker) => isKeySegment(marker.path[3]) && marker.path[3]._key === annotation._key
      )

      const annotationValidation = validation.filter(
        (marker) => isKeySegment(marker.path[3]) && marker.path[3]._key === annotation._key
      )

      const hasError = annotationValidation.some(isValidationErrorMarker)
      const hasWarning = annotationValidation.some(isValidationWarningMarker)

      const member = portableTextMembers.find((m) => m.key === annotation._key)

      const elmRef = member ? setMemberElementRef(member.item.path, elementRefs) : undefined

      return (
        <Annotation
          attributes={attributes}
          hasError={hasError}
          hasWarning={hasWarning}
          markers={annotationMarkers}
          onExpand={onExpand}
          readOnly={readOnly}
          ref={elmRef}
          renderCustomMarkers={renderCustomMarkers}
          scrollElement={scrollElement}
          type={annotationType}
          validation={annotationValidation}
          value={annotation}
        >
          {defaultRender()}
        </Annotation>
      )
    },
    [
      elementRefs,
      markers,
      onExpand,
      portableTextMembers,
      readOnly,
      renderCustomMarkers,
      scrollElement,
      validation,
    ]
  )

  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)

  const editorNode = useMemo(
    () => (
      <Editor
        hotkeys={editorHotkeys}
        initialSelection={initialSelection}
        isFullscreen={isFullscreen}
        onExpand={onExpand}
        onFocusPath={onFocusPath}
        onCopy={onCopy}
        onPaste={onPaste}
        onToggleFullscreen={handleToggleFullscreen}
        readOnly={isActive === false || readOnly}
        renderAnnotation={renderAnnotation}
        renderBlock={renderBlock}
        renderChild={renderChild}
        setPortalElement={setPortalElement}
        scrollElement={scrollElement}
        scrollSelectionIntoView={scrollSelectionIntoView}
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
      onExpand,
      onFocusPath,
      onPaste,
      readOnly,
      renderAnnotation,
      renderBlock,
      renderChild,
      scrollElement,
      scrollSelectionIntoView,
    ]
  )

  const boundaryElm = isFullscreen ? scrollElement : boundaryElement

  const handleObjectEditModalClose = useCallback(
    (path) => {
      onCollapse(path)
      PortableTextEditor.focus(editor)
      const editorSel = PortableTextEditor.getSelection(editor)
      if (editorSel) {
        onFocusPath(editorSel.focus.path)
      }
    },
    [editor, onCollapse, onFocusPath]
  )

  const children = boundaryElm && (
    <>
      {editorNode}
      <BoundaryElementProvider element={boundaryElm}>
        {collapsedObjectMembers.map((dMember) => {
          const elmRef = elementRefs.get(dMember.item.path)
          // NOTE: elmRef may not be created yet if this is a newly inserted object or if it's not yet expanded.
          if (elmRef) {
            return (
              <ObjectEditModal
                key={dMember.key}
                member={dMember}
                onClose={handleObjectEditModalClose}
                scrollElement={boundaryElm}
                elementRef={elmRef}
              >
                {/* TODO: fix types */}
                <FormInput absolutePath={dMember.item.path as FIXME} {...(props as FIXME)} />
              </ObjectEditModal>
            )
          }
          return null
        })}
      </BoundaryElementProvider>
    </>
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
        <ChangeIndicatorWithProvidedFullPath
          compareDeep
          value={value}
          hasFocus={hasFocus}
          path={EMPTY_ARRAY}
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
        </ChangeIndicatorWithProvidedFullPath>
      </ActivateOnFocus>
    </PortalProvider>
  )
}

function setMemberElementRef(path: Path, elementRefs: EditorElementWeakMap) {
  let elmRef = elementRefs.get(path)
  if (!elmRef) {
    elmRef = createRef<EditorElement>()
    elementRefs.set(path, elmRef)
  }
  return elmRef
}
