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
import {useDocumentOperations} from './useDocumentOperations'
import schema from 'part:@sanity/base/schema'
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
  console.log(actionState)
  console.log(actionState.dialog)

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
        <ActionButtonRenderer action={action} record={props.record} type={props.type} />
      ))}
    </div>
  )
}

const OtherEditor = streamingComponent(props$ => {
  return props$.pipe(
    switchMap(props => documentStore.local.editStateOf(props.id, props.type)),
    map(docState => <pre>{JSON.stringify(docState.draft, null, 2)}</pre>)
  )
})

export const TestActionsTool = withRouterHOC(
  streamingComponent(props$ => {
    const docId$ = props$.pipe(
      map(props => props.router),
      switchMap(router => {
        if (!router.state.id) {
          router.navigate({id: `38552d45-143b-4909-9a7e-c5e52a798eb6`, type: 'arraysTest'})
          return EMPTY
        }
        return of([router.state.id, router.state.type])
      }),
      distinctUntilChanged()
    )

    return combineLatest([docId$, currentUser$]).pipe(
      switchMap(([[id, type], currentUser]) => {
        const doc$ = documentStore.local.editStateOf(id, type)
        return doc$.pipe(
          map(documentState => {
            return (
              <div style={{padding: '1em'}}>
                <h2>Now editing: {documentState.id}</h2>
                <pre>{JSON.stringify(documentState, null, 2)}</pre>
                {/*<ActionMenu record={record} type={{type: 'document', name: 'mock'}} />*/}
                <Footer record={documentState} type={schema.get(type)} />

                <OtherEditor id={id} type={type} />
              </div>
            )
          })
        )
      })
    )
  })
)

// export const TestActionsTool = () => {
//   const doc = useDocumentActions('38552d45-143b-4909-9a7e-c5e52a798eb6', 'arraysTest')
//
//   if (!doc) {
//     return null
//   }
//
//   const {draft, published, publish, patch, discardDraft, commit} = doc
//   return (
//     <>
//       <h2>Testing</h2>
//       <div>
//         <button
//           onClick={() => {
//             publish().subscribe()
//           }}
//         >
//           Publish!
//         </button>
//         <button
//           onClick={() => {
//             commit().subscribe()
//           }}
//         >
//           Commit!
//         </button>
//         <button
//           onClick={() => {
//             discardDraft()
//           }}
//         >
//           Discard draft
//         </button>
//         <button
//           onClick={() => {
//             patch([
//               {
//                 set: {
//                   title: `hello ${Math.random()
//                     .toString(32)
//                     .substring(2)}`
//                 }
//               }
//             ])
//           }}
//         >
//           Make an edit
//         </button>
//       </div>
//       <pre>{JSON.stringify({draft, published}, null, 2)}</pre>
//     </>
//   )
// }
