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
} from '@sanity/portable-text-editor'
import {Path} from '@sanity/types'
import {BoundaryElementProvider, useBoundaryElement, useGlobalKeyDown, useLayer} from '@sanity/ui'
import React, {useCallback, useMemo, useRef} from 'react'
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

interface EditorProps {
  initialSelection?: EditorSelection
  isFullscreen: boolean
  hotkeys: HotkeyOptions
  onCopy?: OnCopyFn
  onOpenItem: (path: Path) => void
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

const renderDecorator: RenderDecoratorFunction = (mark, mType, attributes, defaultRender) => {
  return <Decorator mark={mark}>{defaultRender()}</Decorator>
}

export function Editor(props: EditorProps) {
  const {
    hotkeys,
    initialSelection,
    isFullscreen,
    onCopy,
    onOpenItem,
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

  // Keep the editor focused even though we are clicking on the background or the toolbar of the editor.
  const handleMouseDown = useCallback((event: React.SyntheticEvent) => {
    if (event.target instanceof Node && !editableRef.current?.contains(event.target)) {
      event.preventDefault()
      event.stopPropagation()
    }
  }, [])

  const renderPlaceholder = useCallback(() => <>Empty</>, [])
  const spellcheck = useSpellcheck()

  const scrollSelectionIntoView = useScrollSelectionIntoView(scrollElement)

  const editable = useMemo(
    () => (
      <PortableTextEditable
        hotkeys={hotkeys}
        onCopy={onCopy}
        onPaste={onPaste}
        ref={editableRef}
        readOnly={readOnly}
        renderAnnotation={renderAnnotation}
        renderBlock={renderBlock}
        renderChild={renderChild}
        renderDecorator={renderDecorator}
        renderPlaceholder={renderPlaceholder}
        scrollSelectionIntoView={scrollSelectionIntoView}
        selection={initialSelection}
        spellCheck={spellcheck}
      />
    ),
    [
      hotkeys,
      initialSelection,
      onCopy,
      onPaste,
      readOnly,
      renderAnnotation,
      renderBlock,
      renderChild,
      renderPlaceholder,
      scrollSelectionIntoView,
      spellcheck,
    ]
  )

  const handleToolBarOnExpand = useCallback(
    (relativePath: Path) => {
      onOpenItem(path.concat(relativePath))
    },
    [onOpenItem, path]
  )

  return (
    <Root $fullscreen={isFullscreen} data-testid="pt-editor" onMouseDown={handleMouseDown}>
      {!readOnly && (
        <ToolbarCard data-testid="pt-editor__toolbar-card" shadow={1}>
          <Toolbar
            isFullscreen={isFullscreen}
            hotkeys={hotkeys}
            onExpand={handleToolBarOnExpand}
            readOnly={readOnly}
            onToggleFullscreen={onToggleFullscreen}
          />
        </ToolbarCard>
      )}

      <EditableCard flex={1}>
        <Scroller ref={setScrollElement}>
          <EditableContainer padding={isFullscreen ? 2 : 0} sizing="border" width={1}>
            <EditableWrapper $isFullscreen={isFullscreen} $readOnly={readOnly}>
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
