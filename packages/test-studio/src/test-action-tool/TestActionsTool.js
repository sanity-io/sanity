import * as React from 'react'
import actions from 'all:part:@sanity/base/document-action'
import {groupBy} from 'lodash'
import {streamingComponent} from 'react-props-stream'
import {listenDocRecord} from '../mockDocStateDatastore'
import {Subject, merge, of} from 'rxjs'
import {switchMap, map} from 'rxjs/operators'
import PopOverDialog from 'part:@sanity/components/dialogs/popover'

function createAction() {
  const actions$ = new Subject()
  return [actions$.asObservable(), val => actions$.next(val)]
}
const [currentId$, setCurrentId] = createAction()
export const navigate = id => {
  setCurrentId(id)
}

const RenderActionDialog = props => {
  switch (props.dialog.type) {
    case 'popover': {
      return (
        <PopOverDialog on>
          {props.dialog.children}
        </PopOverDialog>
      )
    }
  }
}

const ActionWrapper = props => {
  const {action} = props
  return (
    <>
      <button onClick={action.handle} disabled={action.disabled}>
        {action.label}
      </button>
      {action.dialog && <RenderActionDialog dialog={action.dialog} />}
    </>
  )
}

function TestActionState(props) {
  const groups = groupBy(actions, 'group')

  return (
    <div>
      <h2>Now editing: {props.record.id}</h2>
      <pre>{JSON.stringify(props.record, null, 2)}</pre>
      {(groups.primary || []).map(action => {
        const act = action.action(props.record)
        return act ? <ActionWrapper action={act} /> : null
      })}
    </div>
  )
}

export const TestActionsTool = streamingComponent(() => {
  return merge(of('mock-document'), currentId$).pipe(
    switchMap(listenDocRecord),
    map(record => <TestActionState record={record} />)
  )
})
