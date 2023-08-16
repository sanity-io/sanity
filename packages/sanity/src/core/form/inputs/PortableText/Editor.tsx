import {
  HotkeyOptions,
  PortableTextEditable,
  RenderAnnotationFunction,
  RenderBlockFunction,
  RenderChildFunction,
  RenderDecoratorFunction,
  OnPasteFn,
  OnCopyFn,
  EditorSelection,
  PortableTextEditor,
  usePortableTextEditor,
  RenderStyleFunction,
  RenderListItemFunction,
} from '@sanity/portable-text-editor'
import {Path} from '@sanity/types'
import {BoundaryElementProvider, useBoundaryElement, useGlobalKeyDown, useLayer} from '@sanity/ui'
import React, {useCallback, useEffect, useMemo, useRef} from 'react'
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
import {useSpellcheck} from './hooks/useSpellCheck'
import {useScrollSelectionIntoView} from './hooks/useScrollSelectionIntoView'
import {Style} from './text/Style'
import {ListItem} from './text/ListItem'

const noOutlineStyle = {outline: 'none'} as const

interface EditorProps {
  hasFocus: boolean
  hotkeys: HotkeyOptions
  initialSelection?: EditorSelection
  isActive: boolean
  isFullscreen: boolean
  onCopy?: OnCopyFn
  onItemOpen: (path: Path) => void
  onPaste?: OnPasteFn
  onToggleFullscreen: () => void
  path: Path
  readOnly?: boolean
  renderAnnotation: RenderAnnotationFunction
  renderBlock: RenderBlockFunction
  renderChild: RenderChildFunction
  scrollElement: HTMLElement | null
  setPortalElement?: (portalElement: HTMLDivElement | null) => void
  setScrollElement: (scrollElement: HTMLElement | null) => void
}

const renderDecorator: RenderDecoratorFunction = (props) => {
  return <Decorator {...props} />
}

const renderStyle: RenderStyleFunction = (props) => {
  return <Style {...props} />
}

const renderListItem: RenderListItemFunction = (props) => {
  return <ListItem {...props} />
}

export function Editor(props: EditorProps) {
  const {
    hasFocus,
    hotkeys,
    initialSelection,
    isActive,
    isFullscreen,
    onCopy,
    onItemOpen,
    onPaste,
    onToggleFullscreen,
    path,
    readOnly,
    renderAnnotation,
    renderBlock,
    renderChild,
    scrollElement,
    setPortalElement,
    setScrollElement,
  } = props
  const {isTopLayer} = useLayer()
  const editableRef = useRef<HTMLDivElement | null>(null)
  const editor = usePortableTextEditor()

  const {element: boundaryElement} = useBoundaryElement()

  // Let escape close fullscreen mode
  useGlobalKeyDown(
    useCallback(
      (event: KeyboardEvent) => {
        if (!isTopLayer || !isFullscreen) {
          return
        }
        if (event.key === 'Escape') {
          onToggleFullscreen()
        }
      },
      [onToggleFullscreen, isFullscreen, isTopLayer]
    )
  )

  const renderPlaceholder = useCallback(() => <>Empty</>, [])
  const spellcheck = useSpellcheck()

  const scrollSelectionIntoView = useScrollSelectionIntoView(scrollElement)

  // Re-focus/blur the editor when toggling fullscreen.
  // The hasFocus is kept in ref so focus or blur is called only
  // when `isFullscreen` changes (and not when `hasFocus` changes)
  // This is important to avoid focus/blur loops when opening up
  // object blocks for editing where the form focus and
  // the editor selection share the same path.
  const focusRef = useRef(hasFocus)
  useEffect(() => {
    focusRef.current = hasFocus
  }, [hasFocus])
  useEffect(() => {
    if (focusRef.current) {
      PortableTextEditor.focus(editor)
    }
  }, [editor, isFullscreen])

  const editable = useMemo(
    () => (
      <PortableTextEditable
        hotkeys={hotkeys}
        onCopy={onCopy}
        onPaste={onPaste}
        ref={editableRef}
        renderAnnotation={renderAnnotation}
        renderBlock={renderBlock}
        renderChild={renderChild}
        renderDecorator={renderDecorator}
        renderListItem={renderListItem}
        renderPlaceholder={renderPlaceholder}
        renderStyle={renderStyle}
        scrollSelectionIntoView={scrollSelectionIntoView}
        selection={initialSelection}
        style={noOutlineStyle}
        spellCheck={spellcheck}
      />
    ),
    [
      hotkeys,
      initialSelection,
      onCopy,
      onPaste,
      renderAnnotation,
      renderBlock,
      renderChild,
      renderPlaceholder,
      scrollSelectionIntoView,
      spellcheck,
    ]
  )

  const handleToolBarOnMemberOpen = useCallback(
    (relativePath: Path) => {
      onItemOpen(path.concat(relativePath))
    },
    [onItemOpen, path]
  )

  return (
    <Root $fullscreen={isFullscreen} data-testid="pt-editor">
      {isActive && (
        <ToolbarCard data-testid="pt-editor__toolbar-card" shadow={1}>
          <Toolbar
            hotkeys={hotkeys}
            isFullscreen={isFullscreen}
            onMemberOpen={handleToolBarOnMemberOpen}
            onToggleFullscreen={onToggleFullscreen}
            readOnly={readOnly}
          />
        </ToolbarCard>
      )}

      <EditableCard flex={1} tone={readOnly ? 'transparent' : 'default'}>
        <Scroller ref={setScrollElement}>
          <EditableContainer padding={isFullscreen ? 2 : 0} sizing="border" width={1}>
            <EditableWrapper
              $isFullscreen={isFullscreen}
              tone={readOnly ? 'transparent' : 'default'}
            >
              <BoundaryElementProvider element={isFullscreen ? scrollElement : boundaryElement}>
                {editable}
              </BoundaryElementProvider>
            </EditableWrapper>
          </EditableContainer>
        </Scroller>

        <div data-portal="" ref={setPortalElement} />
      </EditableCard>
    </Root>
  )
}
