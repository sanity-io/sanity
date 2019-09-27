import idx from 'idx'
import produce from 'immer'
import {ofType} from 'redux-observable'
import {from, of, empty} from 'rxjs'
import {catchError, mergeAll, mergeMap, switchMap, withLatestFrom} from 'rxjs/operators'
import client from 'part:@sanity/base/client'

/**
 * @typedef {Object} Asset
 * @property {string} _id
 */

/***********
 * ACTIONS *
 ***********/

export const ASSETS_DELETE_COMPLETE = 'ASSETS_DELETE_COMPLETE'
export const ASSETS_DELETE_ERROR = 'ASSETS_DELETE_ERROR'
export const ASSETS_DELETE_PICKED = 'ASSETS_DELETE_PICKED'
export const ASSETS_DELETE_REQUEST = 'ASSETS_DELETE_REQUEST'
export const ASSETS_FETCH_COMPLETE = 'ASSETS_FETCH_COMPLETE'
export const ASSETS_FETCH_ERROR = 'ASSETS_FETCH_ERROR'
export const ASSETS_FETCH_REQUEST = 'ASSETS_FETCH_REQUEST'
export const ASSETS_PICK = 'ASSETS_PICK'
export const ASSETS_PICK_ALL = 'ASSETS_PICK_ALL'
export const ASSETS_PICK_CLEAR = 'ASSETS_PICK_CLEAR'
export const ASSETS_UNCAUGHT_EXCEPTION = 'ASSETS_UNCAUGHT_EXCEPTION'

/***********
 * REDUCER *
 ***********/

/**
 * `allIds` is an ordered array of all assetIds
 * `byIds` is an object literal that contains all normalised assets (with asset IDs as keys)
 */

const INITIAL_STATE = {
  allIds: [],
  byIds: {},
  fetching: false,
  fetchingError: null
}

// eslint-disable-next-line complexity
export default produce((draft, action) => {
  // eslint-disable-next-line default-case
  switch (action.type) {
    /**
     * An asset has been successfully deleted via the client.
     * - Delete asset from the redux store (both the normalised object and ordered assetID).
     */
    case ASSETS_DELETE_COMPLETE: {
      const assetId = idx(action, _ => _.payload.asset._id)
      const deleteIndex = draft.allIds.indexOf(assetId)
      draft.allIds.splice(deleteIndex, 1)
      delete draft.byIds[assetId]
      draft.totalCount -= 1
      break
    }
    /**
     * An asset was unable to be deleted via the client.
     * - Store the error code on asset in question to optionally display to the user.
     * - Clear updating status on asset in question.
     */
    case ASSETS_DELETE_ERROR: {
      const assetId = idx(action, _ => _.payload.asset._id)
      const errorCode = idx(action, _ => _.payload.error.statusCode)
      draft.byIds[assetId].errorCode = errorCode
      draft.byIds[assetId].updating = false
      break
    }
    /**
     * A request to delete an asset has been made (and not yet completed).
     * - Set updating status on asset in question.
     */
    case ASSETS_DELETE_REQUEST: {
      const assetId = idx(action, _ => _.payload.asset._id)
      draft.byIds[assetId].updating = true
      break
    }
    /**
     * A request to fetch assets has succeeded.
     * - If `replace` is true, we clear all existing assets (useful if we want more traditional
     * paginated browsing, e.g going between pages doesn't persist content).
     * - Add all fetched assets as normalised objects, and store asset IDs in a separate ordered array.
     */
    case ASSETS_FETCH_COMPLETE: {
      const assets = idx(action, _ => _.payload.assets)
      const replace = idx(action, _ => _.payload.replace)
      const totalCount = idx(action, _ => _.payload.totalCount)

      if (replace) {
        draft.allIds = []
        draft.byIds = {}
      }

      if (assets) {
        assets.forEach(asset => {
          draft.allIds.push(asset._id)
          draft.byIds[asset._id] = {
            asset: asset,
            picked: false,
            updating: false
          }
        })
      }

      draft.fetching = false
      draft.fetchingError = null
      draft.totalCount = totalCount
      break
    }
    /**
     * A request to fetch assets has failed.
     * - Clear fetching status
     * - Store error status
     */
    case ASSETS_FETCH_ERROR: {
      draft.fetching = false
      draft.fetchingError = true
      break
    }
    /**
     * A request to fetch asset has been made (and not yet completed)
     * - Set fetching status
     * - Clear any previously stored error
     */
    case ASSETS_FETCH_REQUEST:
      draft.fetching = true
      draft.fetchingError = null
      break
    /**
     * An asset as 'picked' or 'checked' for batch operations.
     * (We don't use the word 'select' as that's reserved for the action of inserting an image into an entry).
     * - Set picked status for asset in question
     */
    case ASSETS_PICK: {
      const assetId = idx(action, _ => _.payload.assetId)
      const picked = idx(action, _ => _.payload.picked)

      draft.byIds[assetId].picked = picked
      break
    }
    /**
     * All assets have been picked.
     */
    case ASSETS_PICK_ALL:
      Object.keys(draft.byIds).forEach(key => {
        draft.byIds[key].picked = true
      })
      break
    /**
     * All assets have been unpicked.
     */
    case ASSETS_PICK_CLEAR:
      Object.keys(draft.byIds).forEach(key => {
        draft.byIds[key].picked = false
      })
      break
  }
}, INITIAL_STATE)

/*******************
 * ACTION CREATORS *
 *******************/

/**
 * Delete started
 *
 * @param {Asset} [asset] - Asset to delete
 * @param {('dialog'|'snackbar')} [handleTarget=snackbar] - Where delete errors should be handled.
 * @return {Object} Redux action
 */

export const assetsDelete = (asset, handleTarget = 'snackbar') => ({
  payload: {
    asset,
    handleTarget
  },
  type: ASSETS_DELETE_REQUEST
})

/**
 * Delete success
 *
 * @param {Asset} [asset] Asset to delete
 * @return {Object} Redux action
 */
export const assetsDeleteComplete = asset => ({
  payload: {
    asset
  },
  type: ASSETS_DELETE_COMPLETE
})

/**
 * Delete error
 *
 * @param {Asset} [asset] Asset to delete
 * @param {Object} [error] Returned error object
 * @param {('dialog'|'snackbar')} [handleTarget=snackbar] - Where delete errors should be handled.
 * @return {Object} Redux action
 */
export const assetsDeleteError = (asset, error, handleTarget) => ({
  payload: {
    asset,
    handleTarget,
    error
  },
  type: ASSETS_DELETE_ERROR
})

/**
 * Delete all picked assets
 *
 * @return {Object} Redux action
 */
export const assetsDeletePicked = () => ({
  type: ASSETS_DELETE_PICKED
})

/**
 * Start fetch with constructed GROQ query
 *
 * @param {Object} [options]
 * @param {String} [options.filter] - GROQ filter
 * @param {Object} [options.params] - Params to pass to GROQ query (in `client.fetch`)
 * @param {String} [options.projections] - GROQ projections (must be wrapped in braces)
 * @param {Boolean} [options.replace] - Whether the results of this should replace all existing assets
 * @param {String} [options.selector] - GROQ selector / range
 * @param {String} [options.sort] - GROQ sort
 * @return {Object} Redux action
 */
export const assetsFetch = options => {
  // Set defaults
  const {
    filter = `_type == "sanity.imageAsset"`,
    params = {},
    projections = `{
      _id,
      metadata {dimensions},
      originalFilename,
      url
    }`,
    replace = true,
    selector = ``,
    sort = `order(_updatedAt desc)`
  } = options

  const pipe = sort || selector ? '|' : ''

  // Construct query
  const query = `//groq
    {
      "items": *[${filter}] ${projections} ${pipe} ${sort} ${selector},
      "totalCount": count(*[${filter}] {})
    }
  `

  return {
    payload: {
      params,
      replace,
      query
    },
    type: ASSETS_FETCH_REQUEST
  }
}

/**
 * Fetch has completed
 *
 * @param {Array} [assets] - An array of all fetched assets
 * @param {Boolean} [replace] - Replace all existing assets
 * @return {Object} Redux action
 */
export const assetsFetchComplete = (assets, replace, totalCount) => ({
  payload: {
    assets,
    replace,
    totalCount
  },
  type: ASSETS_FETCH_COMPLETE
})

/**
 * Asset fetch failed
 *
 * @param {String} [assetId] - Asset ID
 * @return {Object} Redux action
 */
export const assetsFetchError = error => ({
  payload: {
    error
  },
  type: ASSETS_FETCH_ERROR
})

/**
 * Pick an asset
 *
 * @param {String} [assetId] - Asset ID
 * @param {Boolean} [picked] - Whether asset is picked or unpicked
 * @return {Object} Redux action
 */
export const assetsPick = (assetId, picked) => ({
  payload: {
    assetId,
    picked
  },
  type: ASSETS_PICK
})

/**
 * Pick all assets
 *
 * @return {Object} Redux action
 */
export const assetsPickAll = () => ({
  type: ASSETS_PICK_ALL
})

/**
 * Unpick all assets
 *
 * @return {Object} Redux action
 */
export const assetsPickClear = () => ({
  type: ASSETS_PICK_CLEAR
})

/*********
 * EPICS *
 *********/

/**
 * List for asset delete requests:
 * - make async call to `client.delete`
 * - return a corresponding success or error action
 */
export const assetsDeleteEpic = action$ =>
  action$.pipe(
    ofType(ASSETS_DELETE_REQUEST),
    mergeMap(action => {
      return of(action).pipe(
        mergeMap(() => {
          const assetId = idx(action, _ => _.payload.asset._id)
          return from(client.delete(assetId))
        }),
        mergeMap(() => {
          const asset = idx(action, _ => _.payload.asset)
          return of(assetsDeleteComplete(asset))
        }),
        catchError(error => {
          const asset = idx(action, _ => _.payload.asset)
          const handleTarget = idx(action, _ => _.payload.handleTarget)
          return of(assetsDeleteError(asset, error, handleTarget))
        })
      )
    })
  )

/**
 * Listen for requests to delete all picked assets:
 * - get all picked items not already in the process of updating
 * - invoke delete action creator for all INDIVIDUAL assets
 */
export const assetsDeletePickedEpic = (action$, state$) =>
  action$.pipe(
    ofType(ASSETS_DELETE_PICKED),
    withLatestFrom(state$),
    mergeMap(([action, state]) => {
      const availableItems = Object.entries(state.assets.byIds).filter(([key, value]) => {
        return value.picked && !value.updating
      })

      if (availableItems.length === 0) {
        return empty()
      }

      const assets = availableItems.map(item => item[1].asset)
      return of(assets)
    }),
    mergeAll(),
    mergeMap(asset => of(assetsDelete(asset, 'snackbar')))
  )

/**
 * Listen for fetch requests:
 * - make async call to `client.fetch`
 * - return a corresponding success or error action
 */
export const assetsFetchEpic = action$ =>
  action$.pipe(
    ofType(ASSETS_FETCH_REQUEST),
    switchMap(action => {
      return of(action).pipe(
        mergeMap(() => {
          const params = idx(action, _ => _.payload.params)
          const query = idx(action, _ => _.payload.query)
          return from(client.fetch(query, params))
        }),
        mergeMap(result => {
          const replace = idx(action, _ => _.payload.replace)
          const {items, totalCount} = result
          return of(assetsFetchComplete(items, replace, totalCount))
        }),
        catchError(error => of(assetsFetchError(error)))
      )
    })
  )
