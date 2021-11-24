// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {DocumentActionDescription} from '@sanity/base'
import {LegacyLayerProvider} from '@sanity/base/components'
import {RenderActionCollectionState} from 'part:@sanity/base/actions/utils'
import isHotkey from 'is-hotkey'
import React, {useCallback, useState} from 'react'
import {ActionStateDialog} from '../statusBar'
import {Pane} from '../../../components/pane'
import {useDocumentPane} from '../useDocumentPane'

export interface KeyboardShortcutResponderProps {
  actionsBoxElement?: HTMLElement | null
  activeIndex: number
  currentMinWidth?: number
  flex: number
  minWidth: number
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
    <Pane onKeyDown={handleKeyDown} tabIndex={-1} {...rest} ref={rootRef}>
      {children}

      {activeAction && activeAction.dialog && (
        <LegacyLayerProvider zOffset="paneFooter">
          <ActionStateDialog dialog={activeAction.dialog} referenceElement={actionsBoxElement} />
        </LegacyLayerProvider>
      )}
    </Pane>
  )
}

export interface DocumentActionShortcutsProps {
  actionsBoxElement?: HTMLElement | null
  currentMinWidth?: number
  debug?: boolean
  flex: number
  minWidth: number
  rootRef: React.Ref<HTMLDivElement>
}

export const DocumentActionShortcuts = React.memo(
  (props: DocumentActionShortcutsProps & React.HTMLProps<HTMLDivElement>) => {
    const {actionsBoxElement, children, ...rest} = props
    const {actions, editState} = useDocumentPane()
    const [activeIndex, setActiveIndex] = useState(-1)

    const onActionStart = useCallback((idx: number) => {
      setActiveIndex(idx)
    }, [])

    if (!editState) return null

    return (
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
    )
  }
)

DocumentActionShortcuts.displayName = 'DocumentActionShortcuts'
