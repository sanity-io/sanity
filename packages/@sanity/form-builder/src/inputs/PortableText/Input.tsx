import {Subject} from 'rxjs'
import React, {useEffect, useState, useMemo, useCallback} from 'react'
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
import {BoundaryElementProvider, Text, Portal, PortalProvider, usePortal} from '@sanity/ui'
import {isEqual} from 'lodash'
import {ChangeIndicatorWithProvidedFullPath} from '@sanity/base/components'
import ActivateOnFocus from '../../components/ActivateOnFocus/ActivateOnFocus'
import PatchEvent from '../../PatchEvent'
import {EMPTY_ARRAY} from '../../utils/empty'
import {BlockObject} from './Objects/BlockObject'
import {InlineObject} from './Objects/InlineObject'
import {EditObject} from './Objects/EditObject'
import {Annotation} from './Text/Annotation'
import {RenderBlockActions, RenderCustomMarkers, ObjectEditData} from './types'
import PortableTextSanityEditor from './Editor'
import {BlockExtrasWithChangeIndicator} from './BlockExtrasOverlay'
import {TextBlock} from './Text/TextBlock'

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
  onBlur: () => void
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
    onBlur,
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

  // Respond to focusPath changes
  useEffect(() => {
    if (focusPath && objectEditData === null) {
      const sameSelection = selection && isEqual(selection.focus.path, focusPath)
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
            PortableTextEditor.select(editor, {
              focus: {path: spanPath, offset: 0},
              anchor: {path: spanPath, offset: 0},
            })
            setObjectEditData({
              editorPath: spanPath,
              formBuilderPath: focusPath.slice(0, 3),
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
          setObjectEditData({editorPath: path, formBuilderPath: path, kind})
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

  // Update the FormBuilder focusPath as we get a new selection from the editor
  // This will also set presence on that path
  useEffect(() => {
    // If no focusPath return
    if (typeof focusPath === 'undefined') {
      return
    }
    // If the focusPath is a annotation (markDef), don't update focusPath,
    // as this will close the editing interface
    const isAnnotationPath = focusPath && focusPath[1] === 'markDefs'
    if (selection && !objectEditData && !isAnnotationPath) {
      const isCollapsed =
        isEqual(selection.focus.path, selection.anchor.path) &&
        selection.focus.offset === selection.anchor.offset
      // Only do it when anchor and focus is the same, or the component will re-render
      // in the middle of selecting multiple lines with the keyboard.
      // TODO: handle this better when we support live cursors
      if (isCollapsed && !isEqual(focusPath, selection.focus.path)) {
        onFocus(selection.focus.path)
      }
    }
  }, [focusPath, objectEditData, onFocus, selection])

  const handleToggleFullscreen = useCallback(() => {
    setInitialSelection(PortableTextEditor.getSelection(editor))
    onToggleFullscreen()
    PortableTextEditor.focus(editor)
  }, [editor, onToggleFullscreen])

  const focus = useCallback((): void => {
    PortableTextEditor.focus(editor)
  }, [editor])

  const handleActivate = useCallback((): void => {
    setIsActive(true)
    focus()
  }, [focus])

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

  const renderBlock = useCallback(
    (
      block: PortableTextBlock,
      blockType: Type,
      attributes: RenderAttributes,
      defaultRender: (b: PortableTextBlock) => JSX.Element
    ) => {
      const hasError =
        markers.filter(
          (marker) =>
            isKeySegment(marker.path[0]) &&
            marker.path[0]._key === block._key &&
            marker.type === 'validation' &&
            marker.level === 'error'
        ).length > 0
      let renderedBlock
      const isTextBlock = block._type === textBlockTypeName
      const blockRef: React.RefObject<HTMLDivElement> = React.createRef()
      if (isTextBlock) {
        renderedBlock = (
          <TextBlock
            blockRef={blockRef}
            hasError={hasError}
            level={block.level}
            listItem={block.listItem}
            style={block.style}
          >
            {defaultRender(block)}
          </TextBlock>
        )
      } else {
        renderedBlock = (
          <BlockObject
            attributes={attributes}
            blockRef={blockRef}
            editor={editor}
            focusPath={focusPath || EMPTY_ARRAY}
            hasError={hasError}
            onFocus={onFocus}
            readOnly={readOnly}
            type={blockType}
            value={block}
          />
        )
      }
      return (
        <div>
          {renderedBlock}
          <BlockExtrasWithChangeIndicator
            attributes={attributes}
            block={block}
            blockRef={blockRef}
            isFullscreen={isFullscreen}
            markers={markers}
            onChange={onChange}
            onFocus={onFocus}
            renderBlockActions={readOnly ? undefined : renderBlockActions}
            renderCustomMarkers={renderCustomMarkers}
            value={value}
          />
        </div>
      )
    },
    [
      editor,
      focusPath,
      isFullscreen,
      markers,
      onChange,
      onFocus,
      readOnly,
      renderBlockActions,
      renderCustomMarkers,
      textBlockTypeName,
      value,
    ]
  )

  const renderChild = useCallback(
    (child, childType, attributes, defaultRender) => {
      const isSpan = child._type === spanTypeName
      if (isSpan) {
        return defaultRender(child)
      }
      const hasError =
        markers.filter(
          (marker) =>
            isKeySegment(marker.path[2]) &&
            marker.path[2]._key === child._key &&
            marker.type === 'validation' &&
            marker.level === 'error'
        ).length > 0
      return (
        <InlineObject
          attributes={attributes}
          hasError={hasError}
          onFocus={onFocus}
          readOnly={readOnly}
          type={childType}
          value={child}
        />
      )
    },
    [markers, onFocus, spanTypeName, readOnly]
  )

  const renderAnnotation = useCallback(
    (annotation, annotationType, attributes, defaultRender) => {
      const hasError =
        markers.filter(
          (marker) =>
            isKeySegment(marker.path[2]) &&
            marker.path[2]._key === annotation._key &&
            marker.type === 'validation' &&
            marker.level === 'error'
        ).length > 0
      return (
        <Annotation
          attributes={attributes}
          hasError={hasError}
          onFocus={onFocus}
          value={annotation}
        >
          {defaultRender()}
        </Annotation>
      )
    },
    [markers, onFocus]
  )

  const handleEditObjectClose = useCallback(() => {
    if (objectEditData) {
      const {editorPath} = objectEditData
      setObjectEditData(null)
      const sel = {
        focus: {path: editorPath, offset: 0},
        anchor: {path: editorPath, offset: 0},
      }
      onFocus(editorPath)
      PortableTextEditor.select(editor, sel)
      setInitialSelection(sel)
    }
    focus()
  }, [editor, focus, objectEditData, onFocus])

  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)
  const [scrollContainerElement, setScrollContainerElement] = useState<HTMLElement | null>(null)

  const ptEditor = useMemo(
    () => (
      <PortableTextSanityEditor
        hotkeys={hotkeys}
        initialSelection={initialSelection}
        isFullscreen={isFullscreen}
        key={`editor-${editorId}`}
        markers={markers}
        onBlur={onBlur}
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
        setScrollContainerElement={setScrollContainerElement}
        value={value}
      />
    ),
    [
      hotkeys,
      initialSelection,
      isFullscreen,
      editorId,
      markers,
      onBlur,
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
        <PortalProvider element={portalElement}>
          <BoundaryElementProvider element={scrollContainerElement}>
            <ExpandedLayer>
              {ptEditor}
              {editObject}
            </ExpandedLayer>
          </BoundaryElementProvider>
        </PortalProvider>
      )
    }

    return (
      <PortalProvider element={portal.element}>
        {ptEditor}
        {editObject}
      </PortalProvider>
    )
  }, [editObject, isFullscreen, portal.element, portalElement, ptEditor, scrollContainerElement])

  return (
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
            <PortalProvider element={isFullscreen ? portal.element : wrapperElement}>
              <Portal>{children}</Portal>
            </PortalProvider>
          </div>
          <div data-border="" />
        </Root>
      </ChangeIndicatorWithProvidedFullPath>
    </ActivateOnFocus>
  )
}
