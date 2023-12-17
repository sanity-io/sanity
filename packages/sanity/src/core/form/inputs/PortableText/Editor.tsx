import {
  PortableTextEditable,
  type EditorSelection,
  type HotkeyOptions,
  type OnCopyFn,
  type OnPasteFn,
  type RenderAnnotationFunction,
  type RenderBlockFunction,
  type RenderChildFunction,
  type RenderDecoratorFunction,
  type RenderListItemFunction,
  type RenderStyleFunction,
} from '@sanity/portable-text-editor'
import type {Path} from '@sanity/types'
import {
  BoundaryElementProvider,
  TooltipDelayGroupProvider,
  useBoundaryElement,
  useGlobalKeyDown,
  useLayer,
} from '@sanity/ui'
import React, {useCallback, useMemo, useRef} from 'react'
import {TOOLTIP_DELAY_PROPS} from '../../../ui-components/tooltip/constants'
import {useTranslation} from '../../../i18n'
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
  ariaDescribedBy: string | undefined
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
/**
 * @internal
 */
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
    ariaDescribedBy,
  } = props
  const {t} = useTranslation()
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
      [onToggleFullscreen, isFullscreen, isTopLayer],
    ),
  )

  const renderPlaceholder = useCallback(
    () => (
      <span data-testid="pt-input-placeholder">{t('inputs.portable-text.empty-placeholder')}</span>
    ),
    [t],
  )
  const spellcheck = useSpellcheck()

  const scrollSelectionIntoView = useScrollSelectionIntoView(scrollElement)

  const editable = useMemo(
    () => (
      <PortableTextEditable
        aria-describedby={ariaDescribedBy}
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
        style={noOutlineStyle}
      />
    ),
    [
      ariaDescribedBy,
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
    ],
  )

  const handleToolBarOnMemberOpen = useCallback(
    (relativePath: Path) => {
      onItemOpen(path.concat(relativePath))
    },
    [onItemOpen, path],
  )

  return (
    <Root $fullscreen={isFullscreen} data-testid="pt-editor">
      {isActive && (
        <TooltipDelayGroupProvider delay={TOOLTIP_DELAY_PROPS}>
          <ToolbarCard data-testid="pt-editor__toolbar-card" shadow={1}>
            <Toolbar
              hotkeys={hotkeys}
              isFullscreen={isFullscreen}
              onMemberOpen={handleToolBarOnMemberOpen}
              onToggleFullscreen={onToggleFullscreen}
              readOnly={readOnly}
            />
          </ToolbarCard>
        </TooltipDelayGroupProvider>
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
