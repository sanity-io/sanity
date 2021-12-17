import {Subject} from 'rxjs'
import React, {useEffect, useState, useMemo, useCallback, useRef} from 'react'
import {FormFieldPresence} from '@sanity/base/presence'
import {
  OnCopyFn,
  OnPasteFn,
  Patch as EditorPatch,
  PortableTextBlock,
  PortableTextEditor,
  usePortableTextEditor,
  usePortableTextEditorSelection,
  HotkeyOptions,
  RenderAttributes,
  Type,
  EditorSelection,
} from '@sanity/portable-text-editor'
import {Path, isKeySegment, Marker, isKeyedObject, KeyedSegment} from '@sanity/types'
import {
  BoundaryElementProvider,
  Portal,
  PortalProvider,
  Text,
  useBoundaryElement,
  usePortal,
} from '@sanity/ui'
import {isEqual} from 'lodash'
import {ChangeIndicatorWithProvidedFullPath} from '@sanity/base/components'
import scrollIntoView from 'scroll-into-view-if-needed'
import ActivateOnFocus from '../../components/ActivateOnFocus/ActivateOnFocus'
import PatchEvent from '../../PatchEvent'
import {BlockObject} from './object/BlockObject'
import {InlineObject} from './object/InlineObject'
import {EditObject} from './object/EditObject'
import {Annotation, TextBlock} from './text'
import {RenderBlockActions, RenderCustomMarkers, ObjectEditData} from './types'
import {Editor} from './Editor'
import {ExpandedLayer, Root} from './Input.styles'

const ROOT_PATH = []

const activateOnFocusMessage = <Text weight="semibold">Click to activate</Text>

interface InputProps {
  editorId: string
  focusPath: Path
  hasFocus: boolean
  hotkeys: HotkeyOptions
  isFullscreen: boolean
  markers: Marker[]
  onChange: (event: PatchEvent) => void
  onCopy?: OnCopyFn
  onFocus: (path: Path) => void
  onPaste?: OnPasteFn
  onToggleFullscreen: () => void
  patches$: Subject<EditorPatch>
  presence: FormFieldPresence[]
  readOnly: boolean | null
  renderBlockActions?: RenderBlockActions
  renderCustomMarkers?: RenderCustomMarkers
  value: PortableTextBlock[] | undefined
}

export function Input(props: InputProps) {
  const {
    editorId,
    focusPath,
    hasFocus,
    hotkeys,
    isFullscreen,
    markers,
    onChange,
    onCopy,
    onFocus,
    onPaste,
    onToggleFullscreen,
    presence,
    readOnly,
    renderBlockActions,
    renderCustomMarkers,
    value,
  } = props

  const [wrapperElement, setWrapperElement] = useState<HTMLDivElement | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null)
  const [objectEditData, setObjectEditData]: [
    ObjectEditData,
    (data: ObjectEditData) => void
  ] = useState(null)

  const editor = usePortableTextEditor()

  const selection = usePortableTextEditorSelection()

  const portal = usePortal()

  const {element: boundaryElement} = useBoundaryElement()

  const ptFeatures = useMemo(() => PortableTextEditor.getPortableTextFeatures(editor), [editor])

  const initialSelection = useMemo(
    (): EditorSelection =>
      focusPath && focusPath.length > 0
        ? {
            anchor: {path: focusPath, offset: 0},
            focus: {path: focusPath, offset: 0},
          }
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Empty!
  )

  const textBlockSpellCheck = useMemo(() => {
    // Chrome 96. has serious perf. issues with spellchecking
    // https://bugs.chromium.org/p/chromium/issues/detail?id=1271918
    // TODO: check up on the status of this.
    const spellCheckOption = editor.portableTextFeatures.types.block.options?.spellCheck
    const isChrome96 =
      typeof navigator === 'undefined' ? false : /Chrome\/96/.test(navigator.userAgent)
    return spellCheckOption === undefined && isChrome96 === true ? false : spellCheckOption
  }, [editor])

  const childEditorElementRef = useRef<HTMLSpanElement | undefined>()
  const blockElementRef = useRef<HTMLDivElement | undefined>()

  // Special case to scroll annotated text into view inside the editor when they display their editing interface
  // Special because the focusPath is not on the editable item (the annotated text)
  useEffect(() => {
    if (childEditorElementRef.current && objectEditData && objectEditData.kind === 'annotation') {
      scrollIntoView(childEditorElementRef.current, {
        boundary: scrollElement,
        scrollMode: 'if-needed',
      })
    }
  }, [childEditorElementRef, objectEditData, scrollElement])

  // The editor responds to focusPath and should select and show the right stuff when that changes.
  useEffect(() => {
    if (!focusPath) {
      setObjectEditData(null)
      return
    }
    // Set the ActivateOnFocus component active state if not done already
    const focusWithInContent = focusPath.length > 0
    if (focusWithInContent && !isActive) {
      setIsActive(true)
    }

    const sameSelection = selection && isEqual(selection.focus.path, focusPath)
    const blockSegment = isKeySegment(focusPath[0]) ? focusPath[0] : undefined
    const isChild = blockSegment && focusPath[1] === 'children' && isKeyedObject(focusPath[2])
    const isBlockRootFocus = blockSegment && focusPath.length === 1
    const isChildRootFocus = isChild && focusPath.length === 3
    const isAnnotation = blockSegment && focusPath[1] === 'markDefs'

    // Handle focusPath pointing to a annotated span
    if (isAnnotation && !sameSelection) {
      const [node] = PortableTextEditor.findByPath(editor, focusPath.slice(0, 1))
      const block = node ? (node as PortableTextBlock) : undefined
      const markDefSegment =
        block &&
        PortableTextEditor.isVoid(editor, block) === false &&
        (focusPath[2] as KeyedSegment)
      if (markDefSegment) {
        const span = block.children.find(
          (child) => Array.isArray(child.marks) && child.marks.includes(markDefSegment._key)
        )
        if (span) {
          const spanPath = [blockSegment, 'children', {_key: span._key}] as Path
          setObjectEditData({
            editorPath: spanPath,
            formBuilderPath: focusPath.slice(0, 3),
            returnToSelection: selection,
            kind: 'annotation',
            editorHTMLElementRef: childEditorElementRef,
          })
          return
        }
      }
    }

    // Handle focusPath pointing to block objects or inline objects
    if (focusPath && ((isChild && focusPath.length > 3) || (!isChild && focusPath.length > 1))) {
      let kind: 'annotation' | 'blockObject' | 'inlineObject' = 'blockObject'
      let path = focusPath.slice(0, 1)
      if (isChild) {
        kind = 'inlineObject'
        path = path.concat(focusPath.slice(1, 3))
      }
      const [node] = PortableTextEditor.findByPath(editor, path)
      // Only if it actually exists
      if (node) {
        setObjectEditData({
          editorPath: path,
          formBuilderPath: path,
          kind,
          returnToSelection: selection,
          editorHTMLElementRef: blockElementRef,
        })
        return
      }
    }

    // If we don't need to edit any object data, just select the thing in the editable.
    if (!sameSelection && (isBlockRootFocus || isChildRootFocus)) {
      const [blockOrChild] = PortableTextEditor.findByPath(editor, focusPath)
      if (blockOrChild) {
        const point = {path: focusPath, offset: 0}
        PortableTextEditor.select(editor, {focus: point, anchor: point})
        setObjectEditData(null)
        return
      }
    }
    childEditorElementRef.current = null
    blockElementRef.current = null
    setObjectEditData(null)
  }, [editor, focusPath, isActive, selection])

  // Set as active whenever we have focus inside the editor.
  useEffect(() => {
    if (hasFocus) {
      setIsActive(true)
    }
  }, [hasFocus])

  const handleToggleFullscreen = useCallback(() => {
    onToggleFullscreen()
  }, [onToggleFullscreen])

  const focus = useCallback((): void => {
    PortableTextEditor.focus(editor)
  }, [editor])

  const handleActivate = useCallback((): void => {
    if (!isActive) {
      setIsActive(true)
      focus()
    }
  }, [focus, isActive])

  const handleFormBuilderEditObjectChange = useCallback(
    (patchEvent: PatchEvent, path: Path): void => {
      let _patchEvent = patchEvent
      path
        .slice(0)
        .reverse()
        .forEach((segment) => {
          _patchEvent = _patchEvent.prefixAll(segment)
        })
      _patchEvent.patches.map((patch) => props.patches$.next(patch))
      onChange(_patchEvent)
    },
    [onChange, props.patches$]
  )

  const spanTypeName = useMemo(() => ptFeatures.types.span.name, [ptFeatures])
  const textBlockTypeName = useMemo(() => ptFeatures.types.block.name, [ptFeatures])
  const isEmptyValue = value === undefined

  const editObjectDataKey = useMemo(() => {
    const last = objectEditData?.editorPath.slice(-1)[0]
    if (last && isKeySegment(last)) {
      return last._key
    }
    return null
  }, [objectEditData?.editorPath])

  const handleEditObjectFormBuilderFocus = useCallback(
    (nextPath: Path): void => {
      if (nextPath) {
        onFocus(nextPath)
      }
      // Blur if we are editing some object
      if (editObjectDataKey) {
        PortableTextEditor.blur(editor)
      }
    },
    [editor, editObjectDataKey, onFocus]
  )

  const handleEditObjectFormBuilderBlur = useCallback(() => {
    // noop
  }, [])

  const renderBlock = useCallback(
    (
      block: PortableTextBlock,
      blockType: Type,
      attributes: RenderAttributes,
      defaultRender: (b: PortableTextBlock) => JSX.Element
    ) => {
      const isTextBlock = block._type === textBlockTypeName
      const blockRef: React.RefObject<HTMLDivElement> = React.createRef()
      const blockMarkers = markers.filter(
        (marker) => isKeySegment(marker.path[0]) && marker.path[0]._key === block._key
      )
      if (isTextBlock) {
        return (
          <TextBlock
            attributes={attributes}
            block={block}
            blockRef={blockRef}
            isFullscreen={isFullscreen}
            markers={blockMarkers}
            onChange={onChange}
            readOnly={readOnly}
            spellCheck={textBlockSpellCheck}
            renderBlockActions={isEmptyValue ? undefined : renderBlockActions}
            renderCustomMarkers={isEmptyValue ? undefined : renderCustomMarkers}
          >
            {defaultRender(block)}
          </TextBlock>
        )
      }
      const useblockElementRef = block._key === editObjectDataKey
      return (
        <BlockObject
          attributes={attributes}
          block={block}
          blockRef={blockRef}
          editor={editor}
          isFullscreen={isFullscreen}
          markers={blockMarkers}
          onChange={onChange}
          onFocus={onFocus}
          readOnly={readOnly}
          ref={useblockElementRef ? blockElementRef : undefined}
          renderBlockActions={isEmptyValue ? undefined : renderBlockActions}
          renderCustomMarkers={isEmptyValue ? undefined : renderCustomMarkers}
          type={blockType}
        />
      )
    },
    [
      editObjectDataKey,
      editor,
      isEmptyValue,
      isFullscreen,
      markers,
      onChange,
      onFocus,
      readOnly,
      renderBlockActions,
      renderCustomMarkers,
      textBlockSpellCheck,
      textBlockTypeName,
    ]
  )

  const renderChild = useCallback(
    (child, childType, attributes, defaultRender) => {
      const isSpan = child._type === spanTypeName
      if (isSpan) {
        const useChildRef = child._key === editObjectDataKey
        return (
          <span ref={useChildRef ? childEditorElementRef : undefined}>{defaultRender(child)}</span>
        )
      }
      const childMarkers = markers.filter(
        (marker) => isKeySegment(marker.path[2]) && marker.path[2]._key === child._key
      )
      const useblockElementRef = child._key === editObjectDataKey
      return (
        <InlineObject
          attributes={attributes}
          markers={childMarkers}
          onFocus={onFocus}
          readOnly={readOnly}
          ref={useblockElementRef ? blockElementRef : undefined}
          renderCustomMarkers={renderCustomMarkers}
          type={childType}
          value={child}
        />
      )
    },
    [editObjectDataKey, markers, onFocus, readOnly, renderCustomMarkers, spanTypeName]
  )

  const renderAnnotation = useCallback(
    (annotation, annotationType, attributes, defaultRender) => {
      const annotationMarkers = markers.filter(
        (marker) => isKeySegment(marker.path[2]) && marker.path[2]._key === annotation._key
      )
      const hasError =
        annotationMarkers.filter(
          (marker) => marker.type === 'validation' && marker.level === 'error'
        ).length > 0
      const hasWarning =
        annotationMarkers.filter(
          (marker) => marker.type === 'validation' && marker.level === 'warning'
        ).length > 0
      return (
        <Annotation
          attributes={attributes}
          hasError={hasError}
          hasWarning={hasWarning}
          onFocus={onFocus}
          markers={annotationMarkers}
          renderCustomMarkers={renderCustomMarkers}
          value={annotation}
          type={annotationType}
          scrollElement={scrollElement}
        >
          {defaultRender()}
        </Annotation>
      )
    },
    [onFocus, markers, renderCustomMarkers, scrollElement]
  )

  const handleEditObjectClose = useCallback(() => {
    let sel: EditorSelection
    if (objectEditData.kind === 'annotation') {
      sel = objectEditData?.returnToSelection || selection
    } else {
      const point = {path: objectEditData.editorPath, offset: 0}
      sel = {focus: point, anchor: point}
    }
    setObjectEditData(null)
    if (sel) {
      PortableTextEditor.select(editor, sel)
    } else {
      PortableTextEditor.focus(editor)
    }
  }, [editor, objectEditData, selection])

  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)

  const editorNode = (
    <Editor
      hotkeys={hotkeys}
      initialSelection={initialSelection}
      isFullscreen={isFullscreen}
      key={`editor-${editorId}`}
      onFocus={onFocus}
      onCopy={onCopy}
      onPaste={onPaste}
      onToggleFullscreen={handleToggleFullscreen}
      readOnly={isActive === false || readOnly}
      renderAnnotation={renderAnnotation}
      renderBlock={renderBlock}
      renderChild={renderChild}
      setPortalElement={setPortalElement}
      value={value}
      scrollElement={scrollElement}
      setScrollElement={setScrollElement}
    />
  )

  const editObjectNode = (
    <BoundaryElementProvider element={isFullscreen ? scrollElement : boundaryElement}>
      <EditObject
        focusPath={focusPath}
        objectEditData={objectEditData}
        markers={markers} // TODO: filter relevant
        onBlur={handleEditObjectFormBuilderBlur}
        onChange={handleFormBuilderEditObjectChange}
        onClose={handleEditObjectClose}
        onFocus={handleEditObjectFormBuilderFocus}
        readOnly={readOnly}
        presence={presence}
        value={value}
      />
    </BoundaryElementProvider>
  )

  const children = (
    <>
      {editorNode}
      {editObjectNode}
    </>
  )

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
        message={activateOnFocusMessage}
        onActivate={handleActivate}
        isOverlayActive={!isActive}
      >
        <ChangeIndicatorWithProvidedFullPath
          compareDeep
          value={value}
          hasFocus={hasFocus && objectEditData === null}
          path={ROOT_PATH}
        >
          <Root data-focused={hasFocus ? '' : undefined} data-read-only={readOnly ? '' : undefined}>
            <div data-wrapper="" ref={setWrapperElement}>
              <Portal __unstable_name={isFullscreen ? 'expanded' : 'collapsed'}>
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
