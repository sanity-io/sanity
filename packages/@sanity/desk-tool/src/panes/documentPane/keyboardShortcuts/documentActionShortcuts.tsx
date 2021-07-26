import React, {useCallback, useState} from 'react'
import {RenderActionCollectionState} from 'part:@sanity/base/actions/utils'
import {useEditState} from '@sanity/react-hooks'
import resolveDocumentActions from 'part:@sanity/base/document-actions/resolver'
import isHotkey from 'is-hotkey'
import {ActionStateDialog} from '../statusBar'

interface KeyboardShortcutResponderProps extends React.ComponentProps<'div'> {
  states: any[]
  activeIndex: number
  onActionStart: (index: number) => void
  rootRef: React.Ref<HTMLDivElement>
}

function KeyboardShortcutResponder({
  states,
  children,
  onKeyDown,
  activeIndex,
  onActionStart,
  rootRef,
  ...rest
}: KeyboardShortcutResponderProps) {
  const active = states[activeIndex]

  const handleKeyDown = useCallback(
    (event) => {
      const matchingStates = states.filter(
        (state) => state.shortcut && isHotkey(state.shortcut, event)
      )

      const matchingState = matchingStates[0]

      if (matchingState) {
        event.preventDefault()
      }

      if (matchingStates.length > 1) {
        // eslint-disable-next-line no-console
        console.warn(
          `Keyboard shortcut conflict: More than one document action matches the shortcut "${matchingState.shortcut}"`
        )
      }

      if (matchingState && !matchingState.disabled) {
        matchingState.onHandle()
        onActionStart(states.indexOf(matchingState))
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
      {active && active.dialog && (
        <ActionStateDialog dialog={active.dialog} referenceElement={null} />
      )}
    </div>
  )
}

interface DocumentActionShortcutsProps {
  id: string
  type: string
  rootRef: React.Ref<HTMLDivElement>
}

export const DocumentActionShortcuts = React.memo(
  (props: DocumentActionShortcutsProps & React.HTMLProps<HTMLDivElement>) => {
    const {id, type, children, ...rest} = props
    const editState = useEditState(id, type)
    const [activeIndex, setActiveIndex] = useState(-1)
    const actions = editState ? resolveDocumentActions(editState) : null

    const onActionStart = useCallback((idx) => {
      setActiveIndex(idx)
    }, [])

    return actions ? (
      <RenderActionCollectionState
        actions={actions}
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
