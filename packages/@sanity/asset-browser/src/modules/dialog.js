import idx from 'idx'
import produce from 'immer'
import {ofType} from 'redux-observable'
import {of} from 'rxjs'
import {filter, mergeMap, withLatestFrom} from 'rxjs/operators'
import {ASSETS_DELETE_ERROR, ASSETS_DELETE_COMPLETE} from './assets'

/***********
 * ACTIONS *
 ***********/

export const DIALOG_CLEAR = 'DIALOG_CLEAR'
export const DIALOG_SHOW_CONFLICTS = 'DIALOG_SHOW_CONFLICTS'
export const DIALOG_SHOW_REFS = 'DIALOG_SHOW_REFS'

/***********
 * REDUCER *
 ***********/

/**
 * `asset` is a Sanity asset, which dialogs reference to display contextual information
 * `type` can be of type 'conflicts' or 'refs':
 * - `refs` displays all asset references, with an option to delete
 * - 'conflicts' is the same as refs, except rendered as a danger dialog with no option to delete
 */

const INITIAL_STATE = {
  asset: null,
  type: null
}

export default produce((draft, action) => {
  // eslint-disable-next-line default-case
  switch (action.type) {
    case DIALOG_CLEAR:
      draft.asset = null
      draft.type = null
      break
    case DIALOG_SHOW_CONFLICTS: {
      const asset = idx(action, _ => _.payload.asset)
      draft.asset = asset
      draft.type = 'conflicts'
      break
    }
    case DIALOG_SHOW_REFS: {
      const asset = idx(action, _ => _.payload.asset)
      draft.asset = asset
      draft.type = 'refs'
      break
    }
  }
}, INITIAL_STATE)

/*******************
 * ACTION CREATORS *
 *******************/

/**
 * Dialog cleared
 *
 * @return {Object} Redux action
 */

export const dialogClear = () => ({
  payload: {
    asset: null
  },
  type: DIALOG_CLEAR
})

/**
 * Display asset conflict dialog
 *
 * @param {Asset} [asset] - Asset to display
 * @return {Object} Redux action
 */

export const dialogShowConflicts = asset => ({
  payload: {
    asset
  },
  type: DIALOG_SHOW_CONFLICTS
})

/**
 * Display asset references
 *
 * @param {Asset} [asset] - Asset to display
 * @return {Object} Redux action
 */

export const dialogShowRefs = asset => ({
  payload: {
    asset
  },
  type: DIALOG_SHOW_REFS
})

/*********
 * EPICS *
 *********/

/**
 * Listen for successful asset deletion:
 * - Clear dialog if the current dialog asset matches recently deleted asset
 */

export const dialogClearEpic = (action$, state$) =>
  action$.pipe(
    ofType(ASSETS_DELETE_COMPLETE),
    withLatestFrom(state$),
    filter(([action, state]) => {
      const dialogAssetId = idx(state, _ => _.dialog.asset._id)
      const assetId = idx(action, _ => _.payload.asset._id)

      return assetId === dialogAssetId
    }),
    mergeMap(() => {
      return of(dialogClear())
    })
  )

/**
 * Listen for asset delete errors:
 * - Show error dialog if `handleTarget === 'dialog'`
 */

export const dialogShowConflictsEpic = action$ =>
  action$.pipe(
    ofType(ASSETS_DELETE_ERROR),
    filter(action => {
      const handleTarget = idx(action, _ => _.payload.handleTarget)
      return handleTarget === 'dialog'
    }),
    mergeMap(action => {
      const asset = idx(action, _ => _.payload.asset)
      return of(dialogShowConflicts(asset))
    })
  )
