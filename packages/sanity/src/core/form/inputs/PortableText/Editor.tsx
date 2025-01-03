import {
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
  type RenderDecoratorFunction,
  type RenderListItemFunction,
  type RenderStyleFunction,
} from '@portabletext/editor'
import {type Path} from '@sanity/types'
import {BoundaryElementProvider, useBoundaryElement, useGlobalKeyDown, useLayer} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {omit} from 'lodash'
import {type ReactNode, useCallback, useMemo} from 'react'
import {css, styled} from 'styled-components'

import {TooltipDelayGroupProvider} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {type PortableTextInputProps} from '../../types/inputProps'
import {useFormBuilder} from '../../useFormBuilder'
import {EditableCard, EditableWrapper, Root, Scroller, ToolbarCard} from './Editor.styles'
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

const PlaceholderWrapper = styled.span((props) => {
  const {color} = getTheme_v2(props.theme)
  return css`
    color: ${color.input.default.enabled.placeholder};
  `
})

interface EditorProps {
  elementRef: React.RefObject<HTMLDivElement | null>
  hideToolbar?: boolean
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
  rangeDecorations?: RangeDecoration[]
  renderAnnotation: RenderAnnotationFunction
  renderBlock: RenderBlockFunction
  renderChild: RenderChildFunction
  renderEditable?: PortableTextInputProps['renderEditable']
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
export function Editor(props: EditorProps): ReactNode {
  const {
    elementRef,
    hideToolbar,
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
    rangeDecorations,
    renderAnnotation,
    renderBlock,
    renderChild,
    renderEditable,
    scrollElement,
    setPortalElement,
    setScrollElement,
    ariaDescribedBy,
  } = props
  const {id} = useFormBuilder()
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
      <PlaceholderWrapper data-testid="pt-input-placeholder">
        {t('inputs.portable-text.empty-placeholder')}
      </PlaceholderWrapper>
    ),
    [t],
  )
  const spellCheck = useSpellCheck()

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
    const defaultRender = (defaultRenderProps: PortableTextEditableProps) => (
      <PortableTextEditable {...editableProps} {...omit(defaultRenderProps, ['renderDefault'])} />
    )
    if (renderEditable) {
      return renderEditable({...editableProps, renderDefault: defaultRender})
    }
    return defaultRender(editableProps)
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
    renderEditable,
    renderPlaceholder,
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
    <Root data-fullscreen={isFullscreen} data-testid="pt-editor">
      {isActive && !hideToolbar && (
        <TooltipDelayGroupProvider>
          <ToolbarCard data-testid="pt-editor__toolbar-card" shadow={1}>
            <Toolbar
              collapsible={collapsibleToolbar}
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
          <div>
            <EditableWrapper
              $isFullscreen={isFullscreen}
              tone={readOnly ? 'transparent' : 'default'}
            >
              <BoundaryElementProvider element={isFullscreen ? scrollElement : boundaryElement}>
                {editable}
              </BoundaryElementProvider>
            </EditableWrapper>
          </div>
        </Scroller>

        <div data-portal="" ref={setPortalElement} />
      </EditableCard>
    </Root>
  )
}
