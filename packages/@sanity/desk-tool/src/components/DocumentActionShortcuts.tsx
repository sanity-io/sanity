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

function KeyboardShortcutResponder({actionStates, activeId, children, className, onTrigger}) {

  const active = actionStates.find(act => act.actionId === activeId)

  const handleKey = React.useCallback(
    event => {
      const matchingStates = actionStates.filter(
        state => state.shortcut && isHotkey(state.shortcut, event)
      )
      if (matchingStates.length > 1) {
        alert('More than one matching keyboard shortcut')
        return
      }
      const matchingState = matchingStates[0]
      if (matchingState) {
        event.preventDefault()
      }
      if (matchingState && !matchingState.disabled) {
        matchingState.onHandle()
        onTrigger(matchingState.actionId)
      }
    },
    [actionStates]
  )

  return (
    <div onKeyDown={handleKey} tabIndex={-1} className={className}>
      {false && (
        <details>
          <summary>Keyboard shortcuts</summary>
          {actionStates
            .filter(s => s.shortcut)
            .map(s => (
              <span
                key={s.id}
                style={{
                  margin: '0 2px',
                  padding: '2px 3px',
                  opacity: s.disabled ? 0.4 : 1
                }}
              >
                <b>{s.label}</b>:{' '}
                <span style={{padding: '2px', borderRadius: '3px', backgroundColor: '#ddd'}}>
                  {s.shortcut}
                </span>
              </span>
            ))}
        </details>
      )}
      {children}
      {active &&
        (active.dialog ? (
          <ActionStateDialog dialog={active.dialog} />
        ) : (
          <Dialog>
            <DialogContent>{active.label || 'Working…'}</DialogContent>
          </Dialog>
        ))}
    </div>
  )
}

export function DocumentActionShortcuts(props: Props) {
  const editState = useEditState(props.id, props.type)

  const actions = editState ? resolveDocumentActions(editState) : null

  const [activeId, setActiveId] = React.useState(null)

  return actions ? (
    <RenderActionCollectionState
      actions={actions}
      actionProps={editState}
      component={KeyboardShortcutResponder}
      onActionComplete={() => setActiveId(null)}
      className={props.className}
      onTrigger={actionId => {
        setActiveId(actionId)
      }}
      activeId={activeId}
    >
      {props.children}
    </RenderActionCollectionState>
  ) : null
}
