import isHotkey from 'is-hotkey'
import React, {ElementType, createElement, useCallback, useMemo, useState} from 'react'
import {ActionStateDialog} from '../statusBar'
import {RenderActionCollectionState} from '../../../components'
import {useDocumentPane} from '../useDocumentPane'
import {DocumentActionDescription, DocumentActionProps, LegacyLayerProvider} from 'sanity'

export interface KeyboardShortcutResponderProps {
  actionsBoxElement: HTMLElement | null
  activeIndex: number
  as?: ElementType
  currentMinWidth?: number
  flex?: number
  id: string
  minWidth?: number
  onActionStart: (index: number) => void
  rootRef: React.Ref<HTMLDivElement>
  states: DocumentActionDescription[]
}

function KeyboardShortcutResponder(
  props: KeyboardShortcutResponderProps & Omit<React.HTMLProps<HTMLDivElement>, 'as' | 'height'>
) {
  const {
    actionsBoxElement,
    activeIndex,
    as = 'div',
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
        (state) => state.shortcut && isHotkey(state.shortcut, event)
      )

      const matchingState = matchingStates[0]

      if (matchingStates.length > 1) {
        // eslint-disable-next-line no-console
        console.warn(
          `Keyboard shortcut conflict: More than one document action matches the shortcut "${matchingState.shortcut}"`
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
    [onActionStart, onKeyDown, states]
  )

  return createElement(
    as,
    {
      id,
      onKeyDown: handleKeyDown,
      tabIndex: -1,
      ...rest,
      ref: rootRef,
    },
    [
      children,
      activeAction && activeAction.dialog && (
        <LegacyLayerProvider zOffset="paneFooter">
          <ActionStateDialog dialog={activeAction.dialog} referenceElement={actionsBoxElement} />
        </LegacyLayerProvider>
      ),
    ]
  )
}

export interface DocumentActionShortcutsProps {
  actionsBoxElement: HTMLElement | null
  as?: ElementType
  currentMinWidth?: number
  debug?: boolean
  flex: number
  id: string
  minWidth: number
  rootRef: React.Ref<HTMLDivElement>
}

export const DocumentActionShortcuts = React.memo(
  (props: DocumentActionShortcutsProps & Omit<React.HTMLProps<HTMLDivElement>, 'as'>) => {
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
      [editState]
    )

    if (!actionProps || !actions) return null

    return (
      <RenderActionCollectionState actionProps={actionProps} actions={actions}>
        {({states}) => (
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
        )}
      </RenderActionCollectionState>
    )
  }
)

DocumentActionShortcuts.displayName = 'DocumentActionShortcuts'
