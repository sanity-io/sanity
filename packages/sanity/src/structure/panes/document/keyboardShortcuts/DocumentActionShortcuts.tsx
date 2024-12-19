import {isHotkey} from 'is-hotkey-esm'
import {
  type ElementType,
  type HTMLProps,
  memo,
  type Ref,
  useCallback,
  useMemo,
  useState,
} from 'react'
import {type DocumentActionDescription, type DocumentActionProps, LegacyLayerProvider} from 'sanity'

import {RenderActionCollectionState} from '../../../components'
import {ActionStateDialog} from '../statusBar'
import {useDocumentPane} from '../useDocumentPane'

export interface KeyboardShortcutResponderProps {
  actionsBoxElement: HTMLElement | null
  activeIndex: number
  as?: ElementType
  currentMinWidth?: number
  flex?: number
  id: string
  minWidth?: number
  onActionStart: (index: number) => void
  rootRef: Ref<HTMLDivElement>
  states: DocumentActionDescription[]
}

const KeyboardShortcutResponder = memo(function KeyboardShortcutResponder(
  props: KeyboardShortcutResponderProps & Omit<HTMLProps<HTMLDivElement>, 'as' | 'height'>,
) {
  const {
    actionsBoxElement,
    activeIndex,
    as: As = 'div',
    children,
    id,
    onActionStart,
    onKeyDown,
    rootRef,
    states,
    ...rest
  } = props

  const activeAction = states[activeIndex]

  const handleKeyDown = useCallback(
    (event: any) => {
      const matchingStates = states.filter(
        (state) => state.shortcut && isHotkey(state.shortcut, event),
      )

      const matchingState = matchingStates[0]

      if (matchingStates.length > 1) {
        // eslint-disable-next-line no-console
        console.warn(
          `Keyboard shortcut conflict: More than one document action matches the shortcut "${matchingState.shortcut}"`,
        )
      }

      if (matchingState && !matchingState.disabled && matchingState.onHandle) {
        event.preventDefault()
        matchingState.onHandle()
        onActionStart(states.indexOf(matchingState))
        return
      }

      if (onKeyDown) {
        onKeyDown(event)
      }
    },
    [onActionStart, onKeyDown, states],
  )

  return (
    <As id={id} onKeyDown={handleKeyDown} tabIndex={-1} {...rest} ref={rootRef}>
      {children}
      {activeAction && activeAction.dialog && (
        <LegacyLayerProvider zOffset="paneFooter">
          <ActionStateDialog dialog={activeAction.dialog} referenceElement={actionsBoxElement} />
        </LegacyLayerProvider>
      )}
    </As>
  )
})

export interface DocumentActionShortcutsProps {
  actionsBoxElement: HTMLElement | null
  as?: ElementType
  currentMinWidth?: number
  debug?: boolean
  flex: number
  id: string
  minWidth: number
  rootRef: Ref<HTMLDivElement>
}

export const DocumentActionShortcuts = memo(
  (props: DocumentActionShortcutsProps & Omit<HTMLProps<HTMLDivElement>, 'as'>) => {
    const {actionsBoxElement, as = 'div', children, ...rest} = props
    const {actions, editState} = useDocumentPane()
    const [activeIndex, setActiveIndex] = useState(-1)

    const onActionStart = useCallback((idx: number) => {
      setActiveIndex(idx)
    }, [])

    const actionProps: DocumentActionProps | null = useMemo(
      () =>
        editState && {
          ...editState,

          // @todo: what to call here?
          onComplete: () => undefined,

          // @todo: get revision string
          revision: undefined,
        },
      [editState],
    )

    const renderDocumentActionShortcuts = useCallback<
      (props: {states: DocumentActionDescription[]}) => React.ReactNode
    >(
      ({states}) => (
        <KeyboardShortcutResponder
          {...rest}
          activeIndex={activeIndex}
          actionsBoxElement={actionsBoxElement}
          as={as}
          onActionStart={onActionStart}
          states={states}
        >
          {children}
        </KeyboardShortcutResponder>
      ),
      [actionsBoxElement, activeIndex, as, children, onActionStart, rest],
    )

    if (!actionProps || !actions) return null

    return (
      <RenderActionCollectionState actionProps={actionProps} actions={actions}>
        {renderDocumentActionShortcuts}
      </RenderActionCollectionState>
    )
  },
)

DocumentActionShortcuts.displayName = 'Memo(DocumentActionShortcuts)'
