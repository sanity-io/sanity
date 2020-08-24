/* eslint-disable react/require-default-props */
import classNames from 'classnames'
import React, {useEffect, useState, useMemo, useCallback} from 'react'
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
  HotkeyOptions
} from '@sanity/portable-text-editor'
import {uniqueId, isEqual} from 'lodash'
import ActivateOnFocus from 'part:@sanity/components/utilities/activate-on-focus'
import {Portal} from 'part:@sanity/components/portal'
import StackedEscapeable from 'part:@sanity/components/utilities/stacked-escapable'
import {Subject} from 'rxjs'
import PatchEvent from '../../PatchEvent'
import {Presence, Marker} from '../../typedefs'
import {Path} from '../../typedefs/path'
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
  hasFocus: boolean
  hotkeys: HotkeyOptions
  isFullscreen: boolean
  markers: Array<Marker>
  onBlur: () => void
  onChange: (arg0: PatchEvent) => void
  onCopy?: OnCopyFn
  onFocus: (Path) => void
  onPaste?: OnPasteFn
  onToggleFullscreen: () => void
  patche$: Subject<EditorPatch>
  presence: Presence[]
  readOnly: boolean | null
  renderBlockActions?: RenderBlockActions
  renderCustomMarkers?: RenderCustomMarkers
  type: Type
  value: PortableTextBlock[] | undefined
}

export default function PortableTextInput(props: Props) {
  const {
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
    value
  } = props

  const editor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()

  const ptFeatures = getPortableTextFeatures(props.type)

  // States
  const [isActive, setIsActive] = useState(false)
  const [objectEditData, setObjectEditData]: [ObjectEditData, any] = useState(null)
  const [showValidationTooltip, setShowValidationTooltip] = useState(false)
  const [initialSelection, setInitialSelection] = useState(undefined)

  // This will open the editing interfaces automatically according to the focusPath.
  // eslint-disable-next-line complexity
  useEffect(() => {
    if (focusPath && objectEditData === null) {
      const isChild = focusPath[1] === 'children'
      const isMarkdef = focusPath[1] === 'markDefs'
      const blockSegment = focusPath[0]

      // Annotation focus paths
      if (isMarkdef && blockSegment && typeof blockSegment === 'object') {
        const block = value && value.find(blk => blk._key === blockSegment._key)
        const markDefSegment = focusPath[2]
        // eslint-disable-next-line max-depth
        if (block && markDefSegment && typeof markDefSegment === 'object') {
          const span = block.children.find(
            child => Array.isArray(child.marks) && child.marks.includes(markDefSegment._key)
          )
          // eslint-disable-next-line max-depth
          if (span) {
            const spanPath = [blockSegment, 'children', {_key: span._key}]
            setIsActive(true)
            PortableTextEditor.select(editor, {
              focus: {path: spanPath, offset: 0},
              anchor: {path: spanPath, offset: 0}
            })
            setObjectEditData({
              editorPath: spanPath,
              formBuilderPath: focusPath.slice(0, 3),
              kind: 'annotation'
            })
          }
        }
        return
      }

      // Block focus paths
      if (focusPath && ((isChild && focusPath.length > 3) || (!isChild && focusPath.length > 1))) {
        let kind = 'blockObject'
        let path = focusPath.slice(0, 1)
        // eslint-disable-next-line max-depth
        if (isChild) {
          kind = 'inlineObject'
          path = path.concat(focusPath.slice(1, 3))
        }
        setIsActive(true)
        PortableTextEditor.select(editor, {
          focus: {path, offset: 0},
          anchor: {path, offset: 0}
        })
        // Make it go to selection first, then load  the editing interface
        setTimeout(() => setObjectEditData({editorPath: path, formBuilderPath: path, kind}))
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
  }, [selection, initialSelection, objectEditData])

  function handleCloseValidationResults(): void {
    setShowValidationTooltip(false)
  }

  function handleToggleValidationResults(): void {
    setShowValidationTooltip(!showValidationTooltip)
  }

  function handleToggleFullscreen(): void {
    setInitialSelection(PortableTextEditor.getSelection(editor))
    onToggleFullscreen()
    PortableTextEditor.focus(editor)
  }

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
      .forEach(segment => {
        _patchEvent = _patchEvent.prefixAll(segment)
      })
    _patchEvent.patches.map(patch => props.patche$.next(patch))
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
        returned = <Header style={block.style}>{returned}</Header>
      } else {
        returned = <Paragraph>{returned}</Paragraph>
      }
    } else {
      // Object blocks
      const blockMarkers = markers.filter(
        marker => typeof marker.path[0] === 'object' && marker.path[0]._key === block._key
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
      marker => typeof marker.path[2] === 'object' && marker.path[2]._key === child._key
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
    // eslint-disable-next-line react/prop-types
    const annotationMarkers = markers.filter(
      marker => typeof marker.path[2] === 'object' && marker.path[2]._key === annotation._key
    )
    return (
      <Annotation
        key={annotation._key}
        attributes={attributes}
        markers={annotationMarkers}
        onFocus={onFocus}
        onChange={handleFormBuilderEditObjectChange}
        readOnly={readOnly}
        type={annotationType}
        value={annotation}
      >
        {defaultRender()}
      </Annotation>
    )
  }

  // Use callback here in order to precisely track the related HTMLElement between renders (where to place popovers etc)
  const renderEditObject = useCallback((): JSX.Element => {
    if (objectEditData === null) {
      return null
    }
    const handleClose = () => {
      const {editorPath} = objectEditData
      setObjectEditData(null)
      const sel = {
        focus: {path: editorPath, offset: 0},
        anchor: {path: editorPath, offset: 0}
      }
      onFocus(editorPath)
      PortableTextEditor.select(editor, sel)
      setInitialSelection(sel)
      focus()
    }
    return (
      <EditObject
        focusPath={focusPath}
        objectEditData={objectEditData}
        markers={markers} // TODO: filter relevant
        onBlur={handleEditObjectFormBuilderBlur}
        onChange={handleFormBuilderEditObjectChange}
        onClose={handleClose}
        onFocus={handleEditObjectFormBuilderFocus}
        readOnly={readOnly}
        presence={presence}
        value={value}
      />
    )
  }, [focusPath, isFullscreen, markers, objectEditData, presence, readOnly, value])

  const ptEditor = (
    <PortableTextSanityEditor
      hotkeys={hotkeys}
      initialSelection={initialSelection}
      isFullscreen={isFullscreen}
      markers={markers}
      onBlur={onBlur}
      onCloseValidationResults={handleCloseValidationResults}
      onFocus={onFocus}
      onFormBuilderChange={onChange}
      onCopy={onCopy}
      onPaste={onPaste}
      onToggleFullscreen={handleToggleFullscreen}
      onToggleValidationResults={handleToggleValidationResults}
      portableTextFeatures={ptFeatures}
      readOnly={isActive === false || readOnly}
      renderAnnotation={renderAnnotation}
      renderBlock={renderBlock}
      renderBlockActions={renderBlockActions}
      renderChild={renderChild}
      renderCustomMarkers={renderCustomMarkers}
      showValidationTooltip={showValidationTooltip}
      value={value}
    />
  )

  const editObject = useMemo(() => {
    return renderEditObject()
  }, [focusPath, markers, objectEditData, presence, value])

  const activationId = useMemo(() => uniqueId('PortableTextInput'), [])
  const fullscreenToggledEditor = (
    <div className={classNames(styles.root, hasFocus && styles.focus, readOnly && styles.readOnly)}>
      {isFullscreen ? (
        <Portal>
          <StackedEscapeable onEscape={handleToggleFullscreen}>
            <div className={classNames(styles.fullscreenPortal, readOnly && styles.readOnly)}>
              {ptEditor}
            </div>
          </StackedEscapeable>
        </Portal>
      ) : (
        <ActivateOnFocus
          inputId={activationId}
          html={<h3 className={styles.activeOnFocusHeading}>Click to edit</h3>}
          isActive={isActive}
          onActivate={handleActivate}
          overlayClassName={styles.activateOnFocusOverlay}
        >
          {ptEditor}
        </ActivateOnFocus>
      )}
    </div>
  )
  return (
    <>
      {fullscreenToggledEditor}
      {editObject}
    </>
  )
}
