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
} from '@sanity/portable-text-editor'
import {Path, isKeySegment, Marker, isKeyedObject} from '@sanity/types'
import {Portal, PortalProvider, Text, usePortal} from '@sanity/ui'
import {isEqual} from 'lodash'
import {ChangeIndicatorWithProvidedFullPath} from '@sanity/base/components'
import ActivateOnFocus from '../../components/ActivateOnFocus/ActivateOnFocus'
import PatchEvent from '../../PatchEvent'
import {BlockObject} from './object/BlockObject'
import {InlineObject} from './object/InlineObject'
import {EditObject} from './object/EditObject'
import {Annotation, TextBlock} from './text'
import {RenderBlockActions, RenderCustomMarkers, ObjectEditData} from './types'
import Editor from './Editor'
import {ExpandedLayer, Root} from './Input.styles'

const ROOT_PATH = []

const activateOnFocusMessage = <Text weight="semibold">Click to activate</Text>

type Props = {
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

export default function PortableTextInput(props: Props) {
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
  const editor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()
  const ptFeatures = useMemo(() => PortableTextEditor.getPortableTextFeatures(editor), [editor])
  const portal = usePortal()

  // States
  const [isActive, setIsActive] = useState(false)
  const [objectEditData, setObjectEditData]: [
    ObjectEditData,
    (data: ObjectEditData) => void
  ] = useState(null)
  const [initialSelection, setInitialSelection] = useState(undefined)
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null)
  const handledFocusPath = useRef(null)

  // Respond to focusPath changes
  useEffect(() => {
    // Wait until the editor is properly initialized
    if (!editor.editable) {
      return
    }

    // Make sure to only handle the same focusPath once
    if (handledFocusPath.current === focusPath) {
      return
    }
    handledFocusPath.current = focusPath

    if (focusPath && objectEditData === null) {
      // Test if this focus path is the same as we got selected already.
      // If it is, just return or the editor will just try to refocus which
      // interferes with tab-navigation etc.
      const sameSelection =
        selection &&
        isEqual(selection.focus.path, focusPath) &&
        isEqual(selection.focus.path, selection.anchor.path)
      if (sameSelection) {
        return
      }
      const blockSegment = isKeySegment(focusPath[0]) && focusPath[0]
      const isBlockOnly = blockSegment && focusPath.length === 1
      const isChild = blockSegment && focusPath[1] === 'children' && isKeyedObject(focusPath[2])
      const isChildOnly = isChild && focusPath.length === 3
      const isAnnotation = blockSegment && focusPath[1] === 'markDefs'
      if ((isBlockOnly || isChildOnly) && !hasFocus) {
        const [node] = PortableTextEditor.findByPath(editor, focusPath)
        if (node) {
          const point = {path: focusPath, offset: 0}
          PortableTextEditor.select(editor, {focus: point, anchor: point})
        }
      } else if (isAnnotation) {
        const block = (PortableTextEditor.getValue(editor) || []).find(
          (blk) => blk._key === blockSegment._key
        )
        const markDefSegment = focusPath[2]
        if (block && isKeySegment(markDefSegment)) {
          const span = block.children.find(
            (child) => Array.isArray(child.marks) && child.marks.includes(markDefSegment._key)
          )
          if (span) {
            const spanPath = [blockSegment, 'children', {_key: span._key}]
            setIsActive(true)
            setObjectEditData({
              editorPath: spanPath,
              formBuilderPath: focusPath.slice(0, 3),
              returnToSelection: selection,
              kind: 'annotation',
            })
          }
        }
        return
      }
      // Block focus paths
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
          setIsActive(true)
          PortableTextEditor.select(editor, {
            focus: {path, offset: 0},
            anchor: {path, offset: 0},
          })
          // Make it go to selection first, then load  the editing interface
          setObjectEditData({
            editorPath: path,
            formBuilderPath: path,
            kind,
            returnToSelection: selection,
          })
        }
      }
    }
  }, [editor, focusPath, hasFocus, objectEditData, selection])

  // Set as active whenever we have focus inside the editor.
  useEffect(() => {
    if (hasFocus) {
      setIsActive(true)
    }
  }, [hasFocus])

  const handleToggleFullscreen = useCallback(() => {
    setInitialSelection(PortableTextEditor.getSelection(editor))
    onToggleFullscreen()
    PortableTextEditor.focus(editor)
  }, [editor, onToggleFullscreen])

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

  const handleEditObjectFormBuilderFocus = useCallback(
    (nextPath: Path): void => {
      if (objectEditData && nextPath) {
        onFocus(nextPath)
      }
    },
    [objectEditData, onFocus]
  )

  const handleEditObjectFormBuilderBlur = useCallback(() => {
    // noop
  }, [])

  const spanTypeName = useMemo(() => ptFeatures.types.span.name, [ptFeatures])
  const textBlockTypeName = useMemo(() => ptFeatures.types.block.name, [ptFeatures])
  const isEmptyValue = value === undefined

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
            renderBlockActions={isEmptyValue ? undefined : renderBlockActions}
            renderCustomMarkers={isEmptyValue ? undefined : renderCustomMarkers}
          >
            {defaultRender(block)}
          </TextBlock>
        )
      }

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
          renderBlockActions={isEmptyValue ? undefined : renderBlockActions}
          renderCustomMarkers={isEmptyValue ? undefined : renderCustomMarkers}
          type={blockType}
        />
      )
    },
    [
      editor,
      isEmptyValue,
      isFullscreen,
      markers,
      onChange,
      onFocus,
      readOnly,
      renderBlockActions,
      renderCustomMarkers,
      textBlockTypeName,
    ]
  )

  const renderChild = useCallback(
    (child, childType, attributes, defaultRender) => {
      const isSpan = child._type === spanTypeName
      if (isSpan) {
        return defaultRender(child)
      }
      const childMarkers = markers.filter(
        (marker) => isKeySegment(marker.path[2]) && marker.path[2]._key === child._key
      )
      return (
        <InlineObject
          attributes={attributes}
          markers={childMarkers}
          onFocus={onFocus}
          readOnly={readOnly}
          renderCustomMarkers={renderCustomMarkers}
          type={childType}
          value={child}
        />
      )
    },
    [spanTypeName, markers, onFocus, readOnly, renderCustomMarkers]
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
    [markers, onFocus, renderCustomMarkers, scrollElement]
  )

  const handleEditObjectClose = useCallback(() => {
    const sel = objectEditData?.returnToSelection || selection
    setObjectEditData(null)
    if (sel) {
      onFocus(sel.focus.path)
      PortableTextEditor.select(editor, sel)
    } else {
      PortableTextEditor.focus(editor)
    }
  }, [editor, objectEditData?.returnToSelection, onFocus, selection])

  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)

  const ptEditor = useMemo(
    () => (
      <Editor
        hotkeys={hotkeys}
        initialSelection={initialSelection}
        isFullscreen={isFullscreen}
        key={`editor-${editorId}`}
        markers={markers}
        onFocus={onFocus}
        onFormBuilderChange={onChange}
        onCopy={onCopy}
        onPaste={onPaste}
        onToggleFullscreen={handleToggleFullscreen}
        readOnly={isActive === false || readOnly}
        renderAnnotation={renderAnnotation}
        renderBlock={renderBlock}
        renderBlockActions={renderBlockActions}
        renderChild={renderChild}
        renderCustomMarkers={renderCustomMarkers}
        setPortalElement={setPortalElement}
        value={value}
        scrollElement={scrollElement}
        setScrollElement={setScrollElement}
      />
    ),
    [
      hotkeys,
      initialSelection,
      isFullscreen,
      editorId,
      markers,
      onFocus,
      onChange,
      onCopy,
      onPaste,
      handleToggleFullscreen,
      isActive,
      readOnly,
      renderAnnotation,
      renderBlock,
      renderBlockActions,
      renderChild,
      renderCustomMarkers,
      value,
      scrollElement,
    ]
  )

  const editObject = useMemo(() => {
    return (
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
    )
  }, [
    focusPath,
    objectEditData,
    markers,
    handleEditObjectFormBuilderBlur,
    handleFormBuilderEditObjectChange,
    handleEditObjectClose,
    handleEditObjectFormBuilderFocus,
    readOnly,
    presence,
    value,
  ])

  const children = useMemo(() => {
    if (isFullscreen) {
      return (
        <ExpandedLayer>
          {ptEditor}
          {editObject}
        </ExpandedLayer>
      )
    }

    return (
      <>
        {ptEditor}
        {editObject}
      </>
    )
  }, [editObject, isFullscreen, ptEditor])

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
              <Portal __unstable_name={isFullscreen ? 'expanded' : 'collapsed'}>{children}</Portal>
            </div>
            <div data-border="" />
          </Root>
        </ChangeIndicatorWithProvidedFullPath>
      </ActivateOnFocus>
    </PortalProvider>
  )
}
