import {
  HotkeyOptions,
  PortableTextEditable,
  RenderAnnotationFunction,
  RenderBlockFunction,
  RenderChildFunction,
  RenderDecoratorFunction,
  OnPasteFn,
  OnCopyFn,
  ScrollSelectionIntoViewFunction,
  EditorSelection,
} from '@sanity/portable-text-editor'
import {Path} from '@sanity/types'
import {BoundaryElementProvider, useBoundaryElement, useLayer} from '@sanity/ui'
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
  scrollSelectionIntoView: ScrollSelectionIntoViewFunction
  setPortalElement?: (portalElement: HTMLDivElement | null) => void
  setScrollElement: (scrollElement: HTMLElement) => void
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
    onFocus,
    onPaste,
    onToggleFullscreen,
    readOnly,
    renderAnnotation,
    renderBlock,
    renderChild,
    scrollElement,
    scrollSelectionIntoView,
    setPortalElement,
    setScrollElement,
  } = props
  const {isTopLayer} = useLayer()
  const editableRef = useRef<HTMLDivElement>()

  const {element: boundaryElement} = useBoundaryElement()

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

  // Keep the editor focused even though we are clicking on the background or the toolbar of the editor.
  const keepFocused = useCallback((event: React.SyntheticEvent) => {
    if (event.target instanceof Node && !editableRef.current.contains(event.target)) {
      event.preventDefault()
      event.stopPropagation()
    }
  }, [])

  const editable = useMemo(
    () => (
      <PortableTextEditable
        hotkeys={hotkeys}
        onCopy={onCopy}
        onPaste={onPaste}
        placeholderText="Empty"
        ref={editableRef}
        renderAnnotation={renderAnnotation}
        renderBlock={renderBlock}
        renderChild={renderChild}
        renderDecorator={renderDecorator}
        scrollSelectionIntoView={scrollSelectionIntoView}
        selection={initialSelection}
        spellCheck={false} // This is taken care of via renderBlock prop
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
      scrollSelectionIntoView,
    ]
  )

  return (
    <Root $fullscreen={isFullscreen} data-testid="pt-editor" onMouseDown={keepFocused}>
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
            <EditableWrapper
              shadow={isFullscreen ? 1 : 0}
              $isFullscreen={isFullscreen}
              $readOnly={readOnly}
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
