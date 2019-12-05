import * as React from 'react'
// import actions from 'all:part:@sanity/base/document-action'
import resolveActions from 'part:@sanity/base/document-actions'
import {groupBy} from 'lodash'

import {streamingComponent} from 'react-props-stream'
import {listenDocRecord, setCurrentUserId} from '../mockDocStateDatastore'
import {Subject, merge, of} from 'rxjs'
import {switchMap, map, distinctUntilChanged} from 'rxjs/operators'
import PopOverDialog from 'part:@sanity/components/dialogs/popover'
import {useCurrentUser, useUsers} from '../actions/hooks'
import Snackbar from 'part:@sanity/components/snackbar/default'
import Button from 'part:@sanity/components/buttons/default'

function createAction() {
  const actions$ = new Subject()
  return [actions$.asObservable(), val => actions$.next(val)]
}

const [currentId$, setCurrentId] = createAction()
export const navigate = id => {
  setCurrentId(id)
}

const RenderActionDialog = props => {
  return <PopOverDialog>{props.dialog}</PopOverDialog>
}

const RenderSnackbar = props => {
  return (
    <Snackbar
      kind={props.snackbar.type}
      actionTitle={props.snackbar.actionTitle}
      onAction={props.snackbar.onAction}
    >
      {props.snackbar.content}
    </Snackbar>
  )
}

const ActionWrapper = props => {
  const {action} = props

  const actionState = action(props.record)

  if (actionState === null) {
    return null
  }

  return (
    <>
      <Button
        loading={actionState.showActivityIndicator}
        onClick={actionState.handle}
        disabled={actionState.disabled}
      >
        {actionState.label}
      </Button>
      {actionState.dialog && <RenderActionDialog dialog={actionState.dialog} />}
      {actionState.snackbar && <RenderSnackbar snackbar={actionState.snackbar} />}
    </>
  )
}

function UserSwitch() {
  const currentUser = useCurrentUser()
  const users = useUsers()
  return (
    users &&
    currentUser && (
      <>
        You are:{' '}
        <select value={currentUser.id} onChange={e => setCurrentUserId(e.currentTarget.value)}>
          {users.map(u => (
            <option value={u.id} key={u.id}>
              {u.displayName}
            </option>
          ))}
        </select>
      </>
    )
  )
}

function ActionMenu(props) {
  const actions = resolveActions(props.record, props.type)
  const groups = groupBy(actions, 'group')

  return (
    <div>
      {(groups.primary || []).map(action => (
        <ActionWrapper action={action} record={props.record} />
      ))}
    </div>
  )
}

function Footer(props) {
  const actions = resolveActions(props.record, props.type)

  return (
    <div>
      {actions.map(action => (
        <ActionWrapper action={action} record={props.record} />
      ))}
    </div>
  )
}

export const TestActionsTool = streamingComponent(() => {
  return merge(of('mock-document'), currentId$).pipe(
    distinctUntilChanged(),
    switchMap(listenDocRecord),
    map(record => (
      <div style={{padding: '1em'}}>
        <UserSwitch />
        <h2>Now editing: {record.id}</h2>
        <pre>{JSON.stringify(record.document, null, 2)}</pre>
        {/*<ActionMenu record={record} type={{type: 'document', name: 'mock'}} />*/}
        <Footer record={record} type={{type: 'document', name: 'mock'}} />
      </div>
    ))
  )
})
