import shallowEquals from 'shallow-equals'
import {Observable, from, of as observableOf} from 'rxjs'
import {switchMap} from 'rxjs/operators'
import generateHelpUrl from '@sanity/generate-help-url'
import isSubscribable from './isSubscribable'
import validateStructure from './validateStructure'
import serializeStructure from './serializeStructure'

export const LOADING = Symbol('LOADING')
export function resolvePanes(structure, ids, prevStructure, fromIndex) {
  const waitStructure = isSubscribable(structure) ? from(structure) : observableOf(structure)
  return waitStructure.pipe(
    switchMap(struct => resolveForStructure(struct, ids, prevStructure, fromIndex))
  )
}

function getInitialPanes(prevStructure, numPanes, fromIndex) {
  const allLoading = new Array(numPanes).fill(LOADING)
  if (!prevStructure) {
    return allLoading
  }

  const remains = prevStructure.slice(0, fromIndex)
  return remains.concat(allLoading.slice(fromIndex))
}

function resolveForStructure(structure, ids, prevStructure, fromIndex) {
  return Observable.create(subscriber => {
    try {
      validateStructure(structure)
    } catch (err) {
      subscriber.error(err)
      return unsubscribe
    }

    const paneIds = [structure.id].concat(ids).filter(Boolean)
    let panes = getInitialPanes(prevStructure, paneIds.length, fromIndex + 1)
    const subscriptions = []

    // Start with all-loading (or previous structure) state
    subscriber.next(panes)

    // Start resolving pane-by-pane
    resolve(Math.max(0, panes.indexOf(LOADING)))

    return unsubscribe

    function resolve(index) {
      if (index > paneIds.length - 1) {
        return
      }

      const id = paneIds[index]
      const parent = panes[index - 1]
      const context = {parent, index, path: paneIds.slice(0, index + 1)}
      if (index === 0) {
        subscribeForUpdates(structure, index, context)
        return
      }

      if (!parent || typeof parent.child !== 'function') {
        subscriber.complete()
        return
      }

      subscribeForUpdates(parent.child, index, context, [id, context])
    }

    function subscribeForUpdates(pane, index, context, resolverArgs) {
      const source = serializeStructure(pane, context, resolverArgs)
      subscriptions.push(
        source.subscribe(result => emit(result, index), error => subscriber.error(error))
      )
    }

    function emit(pane, index) {
      if (typeof pane === 'undefined') {
        // eslint-disable-next-line no-console
        console.warn(
          'Pane at index %d returned no child - see %s',
          index,
          generateHelpUrl('structure-item-returned-no-child')
        )
      }

      if (replacePane(pane, index)) {
        subscriber.next(panes) // eslint-disable-line callback-return
      }

      resolve(index + 1)
    }

    function replacePane(pane, index) {
      if (panes[index] === pane || shallowEquals(panes[index], pane)) {
        return undefined
      }

      panes = panes.slice()
      return pane ? panes.splice(index, 1, pane) : panes.splice(index)
    }

    function unsubscribe() {
      while (subscriptions.length) {
        subscriptions.pop().unsubscribe()
      }
    }
  })
}
