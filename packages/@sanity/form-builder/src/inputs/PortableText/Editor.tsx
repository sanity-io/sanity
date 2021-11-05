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
import {Path} from '@sanity/types'
import {BoundaryElementProvider, useBoundaryElement, useLayer} from '@sanity/ui'
import React, {useMemo, useEffect} from 'react'
import {createScrollSelectionIntoView} from './utils/scrollSelectionIntoView'
import {Toolbar} from './toolbar'
import {Decorator} from './text'
import {
  EditableCard,
  EditableContainer,
  EditableWrapper,
  Root,
  Scroller,
  ToolbarCard,
} from './Editor.styles'

interface EditorProps {
  initialSelection?: EditorSelection
  isFullscreen: boolean
  hotkeys: HotkeyOptions
  onCopy?: OnCopyFn
  onFocus: (nextPath: Path) => void
  onPaste?: OnPasteFn
  onToggleFullscreen: () => void
  readOnly: boolean | null
  renderAnnotation: RenderAnnotationFunction
  renderBlock: RenderBlockFunction
  renderChild: RenderChildFunction
  scrollElement: HTMLElement | null
  setPortalElement?: (portalElement: HTMLDivElement | null) => void
  setScrollElement: (scrollElement: HTMLElement) => void
  value: PortableTextBlock[] | undefined
}

const renderDecorator: RenderDecoratorFunction = (mark, mType, attributes, defaultRender) => {
  return <Decorator mark={mark}>{defaultRender()}</Decorator>
}

export function Editor(props: EditorProps) {
  const {
    hotkeys: hotkeysProp,
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
    scrollElement,
    setPortalElement,
    setScrollElement,
    value,
  } = props

  const editor = usePortableTextEditor()
  const ptFeatures = useMemo(() => PortableTextEditor.getPortableTextFeatures(editor), [editor])
  const {isTopLayer} = useLayer()
  const {element: boundaryElement} = useBoundaryElement()

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
        'mod+enter': onToggleFullscreen,
        // 'mod+o': handleOpenObjectHotkey, // TODO: disabled for now, enable when we agree on the hotkey
        ...(hotkeysProp || {}).custom,
      },
    }),
    [hotkeysProp, onToggleFullscreen]
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
    () => ({marks: {...defaultHotkeys.marks, ...(hotkeysProp || {}).marks}}),
    [hotkeysProp, defaultHotkeys]
  )

  const hotkeys: HotkeyOptions = useMemo(() => ({...marksFromProps, ...customFromProps}), [
    marksFromProps,
    customFromProps,
  ])

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

  const handleScrollSelectionIntoView = useMemo(
    () => createScrollSelectionIntoView(scrollElement),
    [scrollElement]
  )

  return (
    <Root $fullscreen={isFullscreen} data-testid="pt-editor">
      <ToolbarCard data-testid="pt-editor__toolbar-card" shadow={1}>
        <Toolbar
          isFullscreen={isFullscreen}
          hotkeys={hotkeys}
          onFocus={onFocus}
          readOnly={readOnly}
          onToggleFullscreen={onToggleFullscreen}
        />
      </ToolbarCard>

      <EditableCard flex={1} tone="transparent">
        <Scroller ref={setScrollElement}>
          <EditableContainer padding={isFullscreen ? 2 : 0} sizing="border" width={1}>
            <EditableWrapper shadow={isFullscreen ? 1 : 0} $isFullscreen={isFullscreen}>
              <BoundaryElementProvider element={isFullscreen ? scrollElement : boundaryElement}>
                <PortableTextEditable
                  hotkeys={hotkeys}
                  onCopy={onCopy}
                  onPaste={onPaste}
                  placeholderText={value ? undefined : 'Empty'}
                  renderAnnotation={renderAnnotation}
                  renderBlock={renderBlock}
                  renderChild={renderChild}
                  renderDecorator={renderDecorator}
                  scrollSelectionIntoView={handleScrollSelectionIntoView}
                  selection={initialSelection}
                  spellCheck
                />
              </BoundaryElementProvider>
            </EditableWrapper>
          </EditableContainer>
        </Scroller>

        <div data-portal="" ref={setPortalElement} />
      </EditableCard>
    </Root>
  )
}
