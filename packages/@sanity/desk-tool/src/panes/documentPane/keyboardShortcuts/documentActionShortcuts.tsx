import {DocumentActionDescription} from '@sanity/base'
import {LegacyLayerProvider} from '@sanity/base/components'
import {useEditState} from '@sanity/react-hooks'
import {RenderActionCollectionState} from 'part:@sanity/base/actions/utils'
import resolveDocumentActions from 'part:@sanity/base/document-actions/resolver'
import isHotkey from 'is-hotkey'
import React, {useCallback, useState} from 'react'
import {ActionStateDialog} from '../statusBar'

export interface KeyboardShortcutResponderProps {
  actionsBoxElement?: HTMLElement | null
  activeIndex: number
  onActionStart: (index: number) => void
  rootRef: React.Ref<HTMLDivElement>
  states: DocumentActionDescription[]
}

function KeyboardShortcutResponder(
  props: KeyboardShortcutResponderProps & React.HTMLProps<HTMLDivElement>
) {
  const {
    actionsBoxElement,
    activeIndex,
    children,
    onActionStart,
    onKeyDown,
    rootRef,
    states,
    ...rest
  } = props
  const activeAction = states[activeIndex]

  const handleKeyDown = useCallback(
    (event) => {
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

  return (
    <div onKeyDown={handleKeyDown} tabIndex={-1} {...rest} ref={rootRef}>
      {children}

      {activeAction && activeAction.dialog && (
        <LegacyLayerProvider zOffset="paneFooter">
          <ActionStateDialog dialog={activeAction.dialog} referenceElement={actionsBoxElement} />
        </LegacyLayerProvider>
      )}
    </div>
  )
}

export interface DocumentActionShortcutsProps {
  actionsBoxElement?: HTMLElement | null
  id: string
  type: string
  rootRef: React.Ref<HTMLDivElement>
}

export const DocumentActionShortcuts = React.memo(
  (props: DocumentActionShortcutsProps & React.HTMLProps<HTMLDivElement>) => {
    const {actionsBoxElement, id, type, children, ...rest} = props
    const editState = useEditState(id, type)
    const [activeIndex, setActiveIndex] = useState(-1)
    const actions = editState ? resolveDocumentActions(editState) : null

    const onActionStart = useCallback((idx: number) => {
      setActiveIndex(idx)
    }, [])

    return actions ? (
      <RenderActionCollectionState
        actions={actions}
        actionsBoxElement={actionsBoxElement}
        actionProps={editState}
        component={KeyboardShortcutResponder}
        onActionStart={onActionStart}
        activeIndex={activeIndex}
        {...rest}
      >
        {children}
      </RenderActionCollectionState>
    ) : null
  }
)

DocumentActionShortcuts.displayName = 'DocumentActionShortcuts'
