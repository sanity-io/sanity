import classNames from 'classnames'
import {Subject} from 'rxjs'
import React, {useEffect, useState, useMemo, useCallback} from 'react'
import {FormFieldPresence} from '@sanity/base/presence'
import {
  getPortableTextFeatures,
  OnCopyFn,
  OnPasteFn,
  Patch as EditorPatch,
  PortableTextBlock,
  PortableTextEditor,
  Type,
  usePortableTextEditor,
  usePortableTextEditorSelection,
  HotkeyOptions,
} from '@sanity/portable-text-editor'
import {Path, isKeySegment, Marker, isKeyedObject} from '@sanity/types'
import {BoundaryElementProvider, Layer, Portal, PortalProvider} from '@sanity/ui'
import {uniqueId, isEqual} from 'lodash'
import {useZIndex} from '@sanity/base/components'
import {ChangeIndicatorWithProvidedFullPath} from '@sanity/base/lib/change-indicators'
import PatchEvent from '../../../PatchEvent'
import {ActivateOnFocus} from '../../../transitional/ActivateOnFocus'
import styles from './PortableTextInput.css'
import {BlockObject} from './Objects/BlockObject'
import {InlineObject} from './Objects/InlineObject'
import {EditObject} from './Objects/EditObject'
import {Annotation} from './Text/Annotation'
import Blockquote from './Text/Blockquote'
import Header from './Text/Header'
import Paragraph from './Text/Paragraph'
import {RenderBlockActions, RenderCustomMarkers, ObjectEditData} from './types'
import PortableTextSanityEditor from './Editor'

type Props = {
  focusPath: Path
  forceUpdate: (fromValue?: PortableTextBlock[] | undefined) => void
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
  patche$: Subject<EditorPatch>
  presence: FormFieldPresence[]
  readOnly: boolean | null
  renderBlockActions?: RenderBlockActions
  renderCustomMarkers?: RenderCustomMarkers
  type: Type
  value: PortableTextBlock[] | undefined
}

export default function PortableTextInput(props: Props) {
  const {
    focusPath,
    forceUpdate,
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

  const zindex = useZIndex()

  const editor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()

  const ptFeatures = getPortableTextFeatures(props.type)

  // States
  const [isActive, setIsActive] = useState(false)
  const [objectEditData, setObjectEditData]: [ObjectEditData, any] = useState(null)
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
          forceUpdate() // To re-render change-indicators properly
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
        let kind = 'blockObject'
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
  }, [focusPath])

  // Set as active whenever we have focus inside the editor.
  useEffect(() => {
    if (hasFocus) {
      setIsActive(true)
    }
  }, [hasFocus])

  // Update the FormBuilder focusPath as we get a new selection from the editor
  // This will also set presence on that path
  useEffect(() => {
    // If the focuspath is a annotation (markDef), don't update focusPath,
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
  }, [selection])

  const handleToggleFullscreen = useCallback(() => {
    setInitialSelection(PortableTextEditor.getSelection(editor))
    const val = PortableTextEditor.getValue(editor)
    onToggleFullscreen()
    forceUpdate(val)
    setTimeout(() => PortableTextEditor.focus(editor))
  }, [editor, onToggleFullscreen])

  function focus(): void {
    PortableTextEditor.focus(editor)
  }

  function blur(): void {
    PortableTextEditor.blur(editor)
  }

  function handleActivate(): void {
    setIsActive(true)
    focus()
  }

  function handleFormBuilderEditObjectChange(patchEvent: PatchEvent, path: Path): void {
    let _patchEvent = patchEvent
    path
      .slice(0)
      .reverse()
      .forEach((segment) => {
        _patchEvent = _patchEvent.prefixAll(segment)
      })
    _patchEvent.patches.map((patch) => props.patche$.next(patch))
    onChange(_patchEvent)
  }

  function handleEditObjectFormBuilderFocus(nextPath: Path): void {
    if (objectEditData && nextPath) {
      onFocus(nextPath)
    }
  }

  function handleEditObjectFormBuilderBlur(): void {
    // Do nothing
  }

  function renderBlock(block, blockType, attributes, defaultRender) {
    let returned = defaultRender(block)
    // Text blocks
    if (block._type === ptFeatures.types.block.name) {
      // Deal with block style
      if (block.style === 'blockquote') {
        returned = <Blockquote>{returned}</Blockquote>
      } else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(block.style)) {
        returned = <Header block={block}>{returned}</Header>
      } else {
        returned = <Paragraph>{returned}</Paragraph>
      }
    } else {
      // Object blocks
      const blockMarkers = markers.filter(
        (marker) => isKeySegment(marker.path[0]) && marker.path[0]._key === block._key
      )
      returned = (
        <BlockObject
          attributes={attributes}
          editor={editor}
          markers={blockMarkers}
          onChange={handleFormBuilderEditObjectChange}
          onFocus={onFocus}
          readOnly={readOnly}
          type={blockType}
          value={block}
        />
      )
    }
    return returned
  }

  function renderChild(child, childType, attributes, defaultRender) {
    const isSpan = child._type === ptFeatures.types.span.name
    if (isSpan) {
      return defaultRender(child)
    }
    // eslint-disable-next-line react/prop-types
    const inlineMarkers = markers.filter(
      (marker) => isKeySegment(marker.path[2]) && marker.path[2]._key === child._key
    )
    return (
      <InlineObject
        attributes={attributes}
        markers={inlineMarkers}
        onChange={handleFormBuilderEditObjectChange}
        onFocus={onFocus}
        readOnly={readOnly}
        type={childType}
        value={child}
      />
    )
  }

  function renderAnnotation(annotation, annotationType, attributes, defaultRender) {
    const annotationMarkers = markers.filter(
      (marker) => isKeySegment(marker.path[2]) && marker.path[2]._key === annotation._key
    )
    return (
      <Annotation
        attributes={attributes}
        markers={annotationMarkers}
        onChange={handleFormBuilderEditObjectChange}
        onFocus={onFocus}
        readOnly={readOnly}
        type={annotationType}
        value={annotation}
      >
        {defaultRender()}
      </Annotation>
    )
  }

  function handleEditObjectClose() {
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
  }

  function renderEditObject() {
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
  }

  const activationId = useMemo(() => uniqueId('PortableTextInput'), [])

  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)
  const [scrollContainerElement, setScrollContainerElement] = useState<HTMLElement | null>(null)

  const ptEditor = useMemo(
    () => (
      <PortableTextSanityEditor
        hotkeys={hotkeys}
        initialSelection={initialSelection}
        isFullscreen={isFullscreen}
        key={`editor-${activationId}`}
        markers={markers}
        onBlur={onBlur}
        onFocus={onFocus}
        onFormBuilderChange={onChange}
        onCopy={onCopy}
        onPaste={onPaste}
        onToggleFullscreen={handleToggleFullscreen}
        portableTextFeatures={ptFeatures}
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
    [hasFocus, focusPath, isFullscreen, readOnly, value]
  )

  const editObject = useMemo(() => {
    return renderEditObject()
  }, [isFullscreen, focusPath, markers, objectEditData, presence, value])

  return (
    <div className={classNames(styles.root, hasFocus && styles.focus, readOnly && styles.readOnly)}>
      {isFullscreen && (
        <Portal key={`portal-${activationId}`}>
          <PortalProvider element={portalElement}>
            <BoundaryElementProvider element={scrollContainerElement}>
              <Layer
                className={classNames(styles.fullscreenPortal, readOnly && styles.readOnly)}
                zOffset={zindex.pane - 2}
              >
                {ptEditor}
              </Layer>

              {editObject}
            </BoundaryElementProvider>
          </PortalProvider>
        </Portal>
      )}

      {!isFullscreen && (
        <>
          <ActivateOnFocus
            inputId={activationId}
            html={<h3 className={styles.activeOnFocusHeading}>Click to activate</h3>}
            isActive={isActive}
            onActivate={handleActivate}
            overlayClassName={styles.activateOnFocusOverlay}
          >
            <ChangeIndicatorWithProvidedFullPath
              compareDeep
              value={value}
              hasFocus={hasFocus && objectEditData === null}
              path={[]}
            >
              {ptEditor}
            </ChangeIndicatorWithProvidedFullPath>
          </ActivateOnFocus>
          {editObject}
        </>
      )}
    </div>
  )
}
