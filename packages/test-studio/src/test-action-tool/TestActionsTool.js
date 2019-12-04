import * as React from 'react'
import actions from 'all:part:@sanity/base/document-action'
import {groupBy} from 'lodash'
import TestRenderer from 'react-test-renderer'
import {streamingComponent} from 'react-props-stream'
import {listenDocRecord, setCurrentUserId} from '../mockDocStateDatastore'
import {Subject, merge, of} from 'rxjs'
import {switchMap, map, distinctUntilChanged} from 'rxjs/operators'
import PopOverDialog from 'part:@sanity/components/dialogs/popover'
import {useCurrentUser, useUsers} from '../actions/hooks'

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

const ActionWrapper = props => {
  const {action} = props

  const actionState = action.use(props.record)
  if (actionState === null) {
    return null
  }
  return (
    <>
      <button onClick={actionState.handle} disabled={actionState.disabled}>
        {actionState.label}
      </button>
      {actionState.dialog && <RenderActionDialog dialog={actionState.dialog} />}
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
        Current user:{' '}
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

function TestActionState(props) {
  const groups = groupBy(actions, 'group')

  return (
    <div>
      <UserSwitch />
      <h2>Now editing: {props.record.id}</h2>
      <pre>{JSON.stringify(props.record.document, null, 2)}</pre>
      {(groups.primary || []).map(action => (
        <ActionWrapper action={action} record={props.record} />
      ))}
    </div>
  )
}

export const TestActionsTool = streamingComponent(() => {
  return merge(of('mock-document'), currentId$).pipe(
    distinctUntilChanged(),
    switchMap(listenDocRecord),
    map(record => <TestActionState record={record} />)
  )
})
