import React from 'react'
import idx from 'idx'
import pluralize from 'pluralize'
import produce from 'immer'
import {ofType} from 'redux-observable'
import {of} from 'rxjs'
import {bufferTime, filter, mergeMap} from 'rxjs/operators'
import {ASSETS_DELETE_COMPLETE, ASSETS_DELETE_ERROR, ASSETS_FETCH_ERROR} from '../modules/assets'

/***********
 * ACTIONS *
 ***********/

export const SNACKBARS_ADD = 'SNACKBARS_ADD'

/***********
 * REDUCER *
 ***********/

const INITIAL_STATE = {
  items: []
}

export default produce((draft, action) => {
  // eslint-disable-next-line default-case
  switch (action.type) {
    case SNACKBARS_ADD: {
      const asset = idx(action, _ => _.payload.asset)
      const kind = idx(action, _ => _.payload.kind)
      const subtitle = idx(action, _ => _.payload.subtitle)
      const timeout = idx(action, _ => _.payload.timeout)
      const title = idx(action, _ => _.payload.title)

      draft.items.push({
        asset,
        id: new Date().getTime() + Math.floor(Math.random() * 10000),
        kind,
        subtitle,
        timeout,
        title
      })
      break
    }
  }
}, INITIAL_STATE)

/*******************
 * ACTION CREATORS *
 *******************/

/**
 * Add error snackbar
 *
 * @param {Object} [options]
 * @param {Object} [options.subtitle] - Snackbar subtitle
 * @param {Object} [options.title] - Snackbar title
 * @return {Object} Redux action
 */

export const snackbarsAddError = ({subtitle, title}) => ({
  payload: {
    kind: 'error',
    subtitle,
    timeout: 8000,
    title
  },
  type: SNACKBARS_ADD
})

/**
 * Add success snackbar
 *
 * @param {Object} [options]
 * @param {Object} [options.subtitle] - Snackbar subtitle
 * @param {Object} [options.title] - Snackbar title
 * @return {Object} Redux action
 */

export const snackbarsAddSuccess = ({subtitle, title}) => ({
  payload: {
    kind: 'success',
    subtitle,
    timeout: 4000,
    title
  },
  type: SNACKBARS_ADD
})

/*********
 * EPICS *
 *********/

/**
 * Listen for successful asset deletes errors:
 * - Display success snackbar
 * - Buffer responses over 1000ms
 */

export const snackbarsAddSuccessEpic = action$ =>
  action$.pipe(
    ofType(ASSETS_DELETE_COMPLETE),
    bufferTime(1000),
    filter(actions => actions.length > 0),
    mergeMap(actions => {
      const deletedCount = actions.length
      return of(
        snackbarsAddSuccess({
          title: (
            <>
              {deletedCount} {pluralize('image', deletedCount)} deleted
            </>
          )
        })
      )
    })
  )

/**
 * Listen for asset delete errors where `handleTarget == 'snackbar'`:
 * - Display error snackbar
 * - Buffer responses over 1000ms
 */
export const snackbarsAddDeleteErrorsEpic = action$ =>
  action$.pipe(
    ofType(ASSETS_DELETE_ERROR),
    filter(action => {
      const handleTarget = idx(action, _ => _.payload.handleTarget)
      return handleTarget === 'snackbar'
    }),
    bufferTime(1000),
    filter(actions => actions.length > 0),
    mergeMap(actions => {
      const errorCount = actions.length
      return of(
        snackbarsAddError({
          subtitle: 'Please view errors for more information',
          title: (
            <strong>
              Unable to delete {errorCount} {pluralize('image', errorCount)}
            </strong>
          )
        })
      )
    })
  )

/**
 * Listen for asset fetch errors:
 * - Display error snackbar
 */
export const snackbarsAddFetchErrorEpic = action$ =>
  action$.pipe(
    ofType(ASSETS_FETCH_ERROR),
    mergeMap(action => {
      const error = idx(action, _ => _.payload.error)
      return of(
        snackbarsAddError({
          title: <strong>An error occured: {error.toString()}</strong>
        })
      )
    })
  )
