import React from 'react'
import {RenderActionCollectionState} from 'part:@sanity/base/actions/utils'
import {useEditState} from '@sanity/react-hooks'
import resolveDocumentActions from 'part:@sanity/base/document-actions/resolver'
import isHotkey from 'is-hotkey'
import {ActionStateDialog} from './DocumentStatusBar/ActionStateDialog'
import Dialog from 'part:@sanity/components/dialogs/default'
import DialogContent from 'part:@sanity/components/dialogs/content'

interface Props {
  id: string
  type: string
  className?: string
  children: React.ReactNode
}

function KeyboardShortcutResponder({actionStates, activeId, children, className, onActionStart}) {
  const active = actionStates.find(act => act.actionId === activeId)

  const handleKey = React.useCallback(
    event => {
      const matchingStates = actionStates.filter(
        state => state.shortcut && isHotkey(state.shortcut, event)
      )
      const matchingState = matchingStates[0]
      if (matchingState) {
        event.preventDefault()
      }
      if (matchingStates.length > 1) {
        console.warn(
          `Keyboard shortcut conflict: More than one document action matches the shortcut "${matchingState.shortcut}"`
        )
      }
      if (matchingState && !matchingState.disabled) {
        matchingState.onHandle()
        onActionStart(matchingState.actionId)
      }
    },
    [actionStates]
  )
  return (
    <div onKeyDown={handleKey} tabIndex={-1} className={className}>
      {children}
      {active &&
        (active.dialog ? (
          <ActionStateDialog dialog={active.dialog} />
        ) : (
          <Dialog onClose>
            <DialogContent>{active.label || 'Working…'}</DialogContent>
          </Dialog>
        ))}
    </div>
  )
}

export const DocumentActionShortcuts = React.memo((props: Props) => {
  const editState = useEditState(props.id, props.type)

  const actions = editState ? resolveDocumentActions(editState) : null

  const [activeId, setActiveId] = React.useState(null)

  const onActionComplete = React.useCallback(() => setActiveId(null), [])
  const onActionStart = React.useCallback(id => setActiveId(id), [])

  return actions ? (
    <RenderActionCollectionState
      actions={actions}
      actionProps={editState}
      component={KeyboardShortcutResponder}
      onActionStart={onActionStart}
      onActionComplete={onActionComplete}
      className={props.className}
      activeId={activeId}
    >
      {props.children}
    </RenderActionCollectionState>
  ) : null
})
