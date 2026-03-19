import {
  type BlockDecoratorRenderProps,
  type BlockListItemRenderProps,
  type BlockStyleRenderProps,
  type EditorSelection,
  type HotkeyOptions,
  type OnCopyFn,
  type OnPasteFn,
  PortableTextEditable,
  type PortableTextEditableProps,
  type RangeDecoration,
  type RenderAnnotationFunction,
  type RenderBlockFunction,
  type RenderChildFunction,
} from '@portabletext/editor'
import {type Path} from '@sanity/types'
import {BoundaryElementProvider, Card, rem, useBoundaryElement, useGlobalKeyDown, useLayer, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {type ReactNode, useCallback, useMemo} from 'react'
import {TooltipDelayGroupProvider} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {useFormBuilder} from '../../useFormBuilder'
import {assignInlineVars} from '@vanilla-extract/dynamic'

import {
  counterResetVar,
  dropIndicatorLeftVar,
  dropIndicatorRadiusVar,
  dropIndicatorRightVar,
  dropIndicatorWidthVar,
  editableCard,
  editableWrapper,
  firstChildPaddingTopVar,
  heightVar,
  listItemSpaceVar,
  listSpaceVar,
  maxWidthVar,
  paddingBottomVar,
  resizeVar,
  root,
  scroller,
  toolbarCard,
} from './Editor.css'
import {ScrollContainer} from '../../../components/scroll'
import {createListName, TEXT_LEVELS} from './text'
import {useScrollSelectionIntoView} from './hooks/useScrollSelectionIntoView'
import {useSpellCheck} from './hooks/useSpellCheck'
import {Decorator} from './text'
import {ListItem} from './text/ListItem'
import {Style} from './text/Style'
import {Toolbar} from './toolbar'

const noOutlineStyle = {outline: 'none'} as const

// The <FormBuilder> id that represents the default (document pane) form layout.
// This is used to determine whether this editor should apply document pane specific styling.
const FORM_BUILDER_DEFAULT_ID = 'root'


interface EditorProps {
  elementRef: React.RefObject<HTMLDivElement | null>
  hideToolbar?: boolean
  hotkeys: HotkeyOptions
  initialSelection?: EditorSelection
  isActive: boolean
  isFullscreen: boolean
  isOneLine: boolean
  onCopy?: OnCopyFn
  onItemOpen: (path: Path) => void
  onPaste?: OnPasteFn
  onToggleFullscreen: () => void
  path: Path
  readOnly?: boolean
  rangeDecorations?: RangeDecoration[]
  renderAnnotation: RenderAnnotationFunction
  renderBlock: RenderBlockFunction
  renderChild: RenderChildFunction
  scrollElement: HTMLElement | null
  setPortalElement?: (portalElement: HTMLDivElement | null) => void
  setScrollElement: (scrollElement: HTMLElement | null) => void
  ariaDescribedBy: string | undefined
}

/**
 * @internal
 */
export function Editor(props: EditorProps): ReactNode {
  const {
    elementRef,
    hideToolbar,
    hotkeys,
    initialSelection,
    isActive,
    isFullscreen,
    isOneLine,
    onCopy,
    onItemOpen,
    onPaste,
    onToggleFullscreen,
    path,
    readOnly,
    rangeDecorations,
    renderAnnotation,
    renderBlock,
    renderChild,
    scrollElement,
    setPortalElement,
    setScrollElement,
    ariaDescribedBy,
  } = props
  const {id} = useFormBuilder()
  const {space, container, radius} = useThemeV2()
  const {t} = useTranslation()
  const {isTopLayer} = useLayer()

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
      <span data-testid="pt-input-placeholder" style={{color: 'var(--input-placeholder-color)'}}>
        {t('inputs.portable-text.empty-placeholder')}
      </span>
    ),
    [t],
  )
  const spellCheck = useSpellCheck()
  const renderDecorator = useCallback((decoratorProps: BlockDecoratorRenderProps) => {
    return <Decorator {...decoratorProps} />
  }, [])

  const renderStyle = useCallback((styleProps: BlockStyleRenderProps) => {
    return <Style {...styleProps} />
  }, [])

  const renderListItem = useCallback((listItemProps: BlockListItemRenderProps) => {
    return <ListItem {...listItemProps} />
  }, [])

  const scrollSelectionIntoView = useScrollSelectionIntoView(scrollElement)

  const editable = useMemo(() => {
    const editableProps = {
      'aria-describedby': ariaDescribedBy,
      hotkeys,
      onCopy,
      onPaste,
      rangeDecorations,
      'ref': elementRef,
      renderAnnotation,
      renderBlock,
      renderChild,
      renderDecorator,
      renderListItem,
      renderPlaceholder,
      renderStyle,
      scrollSelectionIntoView,
      'selection': initialSelection,
      spellCheck,
      'style': noOutlineStyle,
    } satisfies PortableTextEditableProps

    return <PortableTextEditable {...editableProps} />
  }, [
    ariaDescribedBy,
    elementRef,
    hotkeys,
    initialSelection,
    onCopy,
    onPaste,
    rangeDecorations,
    renderAnnotation,
    renderBlock,
    renderChild,
    renderDecorator,
    renderListItem,
    renderPlaceholder,
    renderStyle,
    scrollSelectionIntoView,
    spellCheck,
  ])

  const handleToolBarOnMemberOpen = useCallback(
    (relativePath: Path) => {
      onItemOpen(path.concat(relativePath))
    },
    [onItemOpen, path],
  )

  // Always collapse toolbars at smaller container widths when in 'default' (document pane) FormBuilder instances
  const collapsibleToolbar = id === FORM_BUILDER_DEFAULT_ID

  return (
    <Card
      className={root}
      data-fullscreen={isFullscreen}
      data-testid="pt-editor"
      style={assignInlineVars({
        [resizeVar]: isOneLine ? 'none' : 'vertical',
        [heightVar]: isOneLine ? 'auto' : '19em',
      })}
    >
      {isActive && !hideToolbar && (
        <TooltipDelayGroupProvider>
          <Card className={toolbarCard} data-testid="pt-editor__toolbar-card" shadow={1}>
            <Toolbar
              collapsible={collapsibleToolbar}
              hotkeys={hotkeys}
              isFullscreen={isFullscreen}
              onMemberOpen={handleToolBarOnMemberOpen}
              onToggleFullscreen={onToggleFullscreen}
              readOnly={readOnly}
            />
          </Card>
        </TooltipDelayGroupProvider>
      )}

      <Card className={editableCard} flex={1} tone={readOnly ? 'transparent' : 'default'}>
        <ScrollContainer className={scroller} ref={setScrollElement}>
          <div>
            <Card
              className={editableWrapper}
              tone={readOnly ? 'transparent' : 'default'}
              style={assignInlineVars({
                [counterResetVar]: TEXT_LEVELS.map((l) => createListName(l)).join(' '),
                [firstChildPaddingTopVar]: `${space[isFullscreen ? 5 : 3]}px`,
                [paddingBottomVar]: isOneLine ? '0' : `${space[isFullscreen ? 9 : 5]}px`,
                [maxWidthVar]: `${container[1]}px`,
                [listSpaceVar]: `${space[3]}px`,
                [listItemSpaceVar]: `${space[2]}px`,
                [dropIndicatorRadiusVar]: `${radius[2]}px`,
                [dropIndicatorLeftVar]: `calc(${isFullscreen ? rem(space[5]) : rem(space[3])} - 1px)`,
                [dropIndicatorRightVar]: `calc(${isFullscreen ? rem(space[5]) : rem(space[3])} - 1px)`,
                [dropIndicatorWidthVar]: `calc(100% - ${isFullscreen ? rem(space[5] * 2) : rem(space[3] * 2)} + 2px) !important`,
              })}
            >
              <BoundaryElementProvider element={isFullscreen ? scrollElement : boundaryElement}>
                {editable}
              </BoundaryElementProvider>
            </Card>
          </div>
        </ScrollContainer>

        <div data-portal="" ref={setPortalElement} />
      </Card>
    </Card>
  )
}
