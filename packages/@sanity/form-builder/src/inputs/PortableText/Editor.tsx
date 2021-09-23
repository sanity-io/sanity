import {
  HotkeyOptions,
  PortableTextBlock,
  PortableTextEditable,
  RenderAnnotationFunction,
  RenderBlockFunction,
  RenderChildFunction,
  RenderDecoratorFunction,
  EditorSelection,
  OnPasteFn,
  OnCopyFn,
  PortableTextEditor,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import {Marker} from '@sanity/types'
import {useLayer} from '@sanity/ui'
import {ScrollContainer} from '@sanity/base/components'
import React, {useMemo, useEffect, useCallback} from 'react'
import PatchEvent from '../../PatchEvent'
import styles from './PortableTextInput.module.css'
import Toolbar from './Toolbar/Toolbar'
import {ExpandCollapseButton} from './expandCollapseButton'
import {RenderBlockActions, RenderCustomMarkers} from './types'
import Decorator from './Text/Decorator'
import BlockExtrasOverlay from './BlockExtrasOverlay'

type Props = {
  initialSelection?: EditorSelection
  isFullscreen: boolean
  markers: Array<Marker>
  hotkeys: HotkeyOptions
  onBlur: () => void
  onCopy?: OnCopyFn
  onFocus: (Path) => void
  onFormBuilderChange: (change: PatchEvent) => void
  onPaste?: OnPasteFn
  onToggleFullscreen: () => void
  readOnly: boolean | null
  renderAnnotation: RenderAnnotationFunction
  renderBlock: RenderBlockFunction
  renderBlockActions?: RenderBlockActions
  renderChild: RenderChildFunction
  renderCustomMarkers?: RenderCustomMarkers
  setPortalElement?: (el: HTMLDivElement | null) => void
  setScrollContainerElement: (el: HTMLElement | null) => void
  value: PortableTextBlock[] | undefined
}

const renderDecorator: RenderDecoratorFunction = (mark, mType, attributes, defaultRender) => {
  return <Decorator mark={mark}>{defaultRender()}</Decorator>
}

function PortableTextSanityEditor(props: Props) {
  const {
    initialSelection,
    isFullscreen,
    markers,
    onCopy,
    onFocus,
    onPaste,
    onToggleFullscreen,
    readOnly,
    renderAnnotation,
    renderBlock,
    renderBlockActions,
    renderChild,
    setPortalElement,
    setScrollContainerElement,
    value,
  } = props

  const editor = usePortableTextEditor()
  const ptFeatures = useMemo(() => PortableTextEditor.getPortableTextFeatures(editor), [editor])
  const {isTopLayer} = useLayer()

  // TODO: Enable when we agree upon the hotkey for opening edit object interface when block object is focused
  //
  // const handleOpenObjectHotkey = (
  //   event: React.BaseSyntheticEvent,
  //   ptEditor: PortableTextEditor
  // ) => {
  //   const selection = PortableTextEditor.getSelection(ptEditor)
  //   if (selection) {
  //     event.preventDefault()
  //     event.stopPropagation()
  //     const {focus} = selection
  //     const activeAnnotations = PortableTextEditor.activeAnnotations(ptEditor)
  //     const focusBlock = PortableTextEditor.focusBlock(ptEditor)
  //     const focusChild = PortableTextEditor.focusChild(ptEditor)
  //     if (activeAnnotations.length > 0) {
  //       onFocus([
  //         ...focus.path.slice(0, 1),
  //         'markDefs',
  //         {_key: activeAnnotations[0]._key},
  //         FOCUS_TERMINATOR,
  //       ])
  //       return
  //     }
  //     if (focusChild && PortableTextEditor.isVoid(ptEditor, focusChild)) {
  //       onFocus([...focus.path, FOCUS_TERMINATOR])
  //       return
  //     }
  //     if (focusBlock && PortableTextEditor.isVoid(ptEditor, focusBlock)) {
  //       onFocus([...focus.path.slice(0, 1), FOCUS_TERMINATOR])
  //     }
  //   }
  // }

  const customFromProps: HotkeyOptions = useMemo(
    () => ({
      custom: {
        'mod+enter': props.onToggleFullscreen,
        // 'mod+o': handleOpenObjectHotkey, // TODO: disabled for now, enable when we agree on the hotkey
        ...(props.hotkeys || {}).custom,
      },
    }),
    [props.hotkeys, props.onToggleFullscreen]
  )

  const defaultHotkeys = useMemo(() => {
    const def = {marks: {}}
    ptFeatures.decorators.forEach((dec) => {
      switch (dec.value) {
        case 'strong':
          def.marks['mod+b'] = dec.value
          break
        case 'em':
          def.marks['mod+i'] = dec.value
          break
        case 'underline':
          def.marks['mod+u'] = dec.value
          break
        case 'code':
          def.marks["mod+'"] = dec.value
          break
        default:
        // Nothing
      }
    })
    return def
  }, [ptFeatures.decorators])

  const marksFromProps: HotkeyOptions = useMemo(
    () => ({
      marks: {
        ...defaultHotkeys.marks,
        ...(props.hotkeys || {}).marks,
      },
    }),
    [props.hotkeys, defaultHotkeys]
  )
  const hotkeys: HotkeyOptions = useMemo(
    () => ({
      ...marksFromProps,
      ...customFromProps,
    }),
    [marksFromProps, customFromProps]
  )

  const hasMarkers = useMemo(() => markers.length > 0, [markers])
  const scClassNames = useMemo(
    () =>
      [
        styles.scrollContainer,
        ...(renderBlockActions || hasMarkers ? [styles.hasBlockExtras] : [styles.hasNoBlockExtras]),
      ].join(' '),
    [hasMarkers, renderBlockActions]
  )
  const editorWrapperClassNames = useMemo(() => [styles.editorWrapper].join(' '), [])
  const editorClassNames = useMemo(
    () =>
      [
        styles.editor,
        ...(renderBlockActions || hasMarkers ? [styles.hasBlockExtras] : [styles.hasNoBlockExtras]),
      ].join(' '),
    [hasMarkers, renderBlockActions]
  )

  useEffect(() => {
    if (!isTopLayer || !isFullscreen) return undefined

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onToggleFullscreen()
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [isFullscreen, isTopLayer, onToggleFullscreen])

  const blockExtras = useCallback(
    () => (
      <BlockExtrasOverlay
        isFullscreen={isFullscreen}
        markers={markers}
        onFocus={onFocus}
        onChange={props.onFormBuilderChange}
        renderBlockActions={readOnly ? undefined : renderBlockActions}
        renderCustomMarkers={props.renderCustomMarkers}
        value={value}
      />
    ),
    [
      isFullscreen,
      markers,
      onFocus,
      props.onFormBuilderChange,
      props.renderCustomMarkers,
      readOnly,
      renderBlockActions,
      value,
    ]
  )
  const sanityEditor = useMemo(
    () => (
      <div className={styles.editorBox}>
        <div className={styles.header}>
          <div className={styles.toolbarContainer}>
            <Toolbar
              isFullscreen={isFullscreen}
              hotkeys={hotkeys}
              onFocus={onFocus}
              renderBlock={renderBlock}
              readOnly={readOnly}
            />
          </div>
          <div className={styles.fullscreenButtonContainer}>
            <ExpandCollapseButton
              isFullscreen={isFullscreen}
              onToggleFullscreen={onToggleFullscreen}
            />
          </div>
        </div>

        <div className={styles.editorBoxContent}>
          <ScrollContainer className={scClassNames} ref={setScrollContainerElement}>
            <div className={editorWrapperClassNames}>
              <div className={styles.blockExtras}>{blockExtras()}</div>
              <div className={editorClassNames}>
                <PortableTextEditable
                  hotkeys={hotkeys}
                  onCopy={onCopy}
                  onPaste={onPaste}
                  placeholderText={value ? undefined : 'Empty'}
                  renderAnnotation={renderAnnotation}
                  renderBlock={renderBlock}
                  renderChild={renderChild}
                  renderDecorator={renderDecorator}
                  selection={initialSelection}
                  spellCheck
                />
              </div>
            </div>
          </ScrollContainer>
          <div data-portal="" ref={setPortalElement} />
        </div>
      </div>
    ),
    [
      blockExtras,
      editorClassNames,
      editorWrapperClassNames,
      hotkeys,
      initialSelection,
      isFullscreen,
      onCopy,
      onFocus,
      onPaste,
      onToggleFullscreen,
      readOnly,
      renderAnnotation,
      renderBlock,
      renderChild,
      scClassNames,
      setPortalElement,
      setScrollContainerElement,
      value,
    ]
  )
  return sanityEditor
}

export default PortableTextSanityEditor
