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
import {Style} from './text/Style'
import {ListItem} from './text/ListItem'

interface EditorProps {
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
  const {children, value, type, focused, selected} = props
  const CustomComponent = type.component
  if (CustomComponent) {
    // eslint-disable-next-line react/jsx-no-bind
    return (
      <CustomComponent
        focused={focused}
        selected={selected}
        title={type.title}
        value={value}
        // eslint-disable-next-line react/jsx-no-bind
        renderDefault={() => <Decorator mark={value}>{children}</Decorator>}
      >
        {children}
      </CustomComponent>
    )
  }
  return <Decorator mark={value}>{children}</Decorator>
}

const renderStyle: RenderStyleFunction = (props) => {
  return <Style {...props} />
}

const renderListItem: RenderListItemFunction = (props) => {
  return <ListItem {...props} />
}

export function Editor(props: EditorProps) {
  const {
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
        renderAnnotation={renderAnnotation}
        renderBlock={renderBlock}
        renderChild={renderChild}
        renderDecorator={renderDecorator}
        renderListItem={renderListItem}
        renderPlaceholder={renderPlaceholder}
        renderStyle={renderStyle}
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
      PortableTextEditor.blur(editor)
      onItemOpen(path.concat(relativePath))
    },
    [editor, onItemOpen, path]
  )

  return (
    <Root $fullscreen={isFullscreen} data-testid="pt-editor" onMouseDown={handleMouseDown}>
      {isActive && (
        <ToolbarCard data-testid="pt-editor__toolbar-card" shadow={1}>
          <Toolbar
            isFullscreen={isFullscreen}
            hotkeys={hotkeys}
            onMemberOpen={handleToolBarOnMemberOpen}
            readOnly={readOnly}
            onToggleFullscreen={onToggleFullscreen}
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
