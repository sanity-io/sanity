import * as React from 'react'
// import actions from 'all:part:@sanity/base/document-action'
import resolveActions from 'part:@sanity/base/document-actions'
import {groupBy} from 'lodash'
import {route, withRouterHOC} from 'part:@sanity/base/router'
import documentStore from 'part:@sanity/base/datastore/document'

import {streamingComponent} from 'react-props-stream'
import {currentUser$, listenDocRecord, setCurrentUserId} from '../mockDocStateDatastore'
import {Subject, merge, EMPTY, combineLatest, of} from 'rxjs'
import {switchMap, tap, map, distinctUntilChanged} from 'rxjs/operators'
import PopOverDialog from 'part:@sanity/components/dialogs/popover'
import {useCurrentUser, useUsers} from '../actions/hooks'
import Snackbar from 'part:@sanity/components/snackbar/default'
import Button from 'part:@sanity/components/buttons/default'

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

const ActionButtonRenderer = props => {
  const actionState = props.action(props.record)

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
        <ActionButtonRenderer action={action} record={props.record} />
      ))}
    </div>
  )
}

function Footer(props) {
  const actions = resolveActions(props.record, props.type)
  return (
    <div>
      {actions.map(action => (
        <ActionButtonRenderer action={action} record={props.record} />
      ))}
    </div>
  )
}

// export const TestActionsTool = withRouterHOC(
//   streamingComponent(props$ => {
//     const docId$ = props$.pipe(
//       map(props => props.router),
//       switchMap(router => {
//         if (!router.state.id) {
//           router.navigate({id: `foo`})
//           return EMPTY
//         }
//         return of(router.state.id)
//       }),
//       distinctUntilChanged()
//     )
//
//     return combineLatest([docId$, currentUser$]).pipe(
//       switchMap(([docId, currentUser]) => {
//         const doc = documentStore.checkoutPair({draftId: `drafts.${docId}`, publishedId: docId})
//         return doc.draft.events.pipe(
//           map(ev => {
//             console.log(ev)
//             const record = {}
//             return (
//               <div style={{padding: '1em'}}>
//                 <h2>Now editing: {record.id}</h2>
//                 <pre>{JSON.stringify(record.document, null, 2)}</pre>
//                 {/*<ActionMenu record={record} type={{type: 'document', name: 'mock'}} />*/}
//                 <Footer record={record} type={{type: 'document', name: 'mock'}} />
//               </div>
//             )
//           })
//         )
//       })
//     )
//   })
// )

export const TestActionsTool = streamingComponent(props$ => {
  const publishedId = `38552d45-143b-4909-9a7e-c5e52a798eb6`
  const draftId = `drafts.${publishedId}`
  const pair$ = documentStore.buffered.getById({draftId, publishedId})
  return pair$.pipe(
    map(pair => {
      return (
        <>
          <h2>Testing</h2>
          <div>
            <pre>
              {JSON.stringify(
                {draft: pair.draft.snapshot, published: pair.published.snapshot},
                null,
                2
              )}
            </pre>
            <button
              onClick={() => {
                debugger
                pair.draft.create({_id: draftId, title: 'Hello'})
                pair.draft.patch([{set: {title: 'Hello2you'}}])
              }}
            >
              Mutate draft plz
            </button>
          </div>
        </>
      )
    })
  )
})
