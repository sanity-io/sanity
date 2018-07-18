import shallowEquals from 'shallow-equals'
import {Observable, from, of as observableOf} from 'rxjs'
import {switchMap} from 'rxjs/operators'
import isSubscribable from './isSubscribable'

export const LOADING = Symbol('LOADING')
export function resolvePanes(structure, ids) {
  const waitStructure = isSubscribable(structure) ? from(structure) : observableOf(structure)
  return waitStructure.pipe(switchMap(struct => resolveForStructure(struct, ids)))
}

function resolveForStructure(structure, ids) {
  return Observable.create(subscriber => {
    const paneIds = [structure.id].concat(ids).filter(Boolean)
    let panes = new Array(paneIds.length).fill(LOADING)
    const subscriptions = []

    // Start will all-loading state
    subscriber.next(panes)

    // Start resolving pane-by-pane
    resolve(0)

    return unsubscribe

    function resolve(index) {
      if (index > paneIds.length - 1) {
        return
      }

      if (index === 0) {
        subscribeForUpdates(structure, index)
        return
      }

      const id = paneIds[index]
      const parent = panes[index - 1]
      if (!parent || typeof parent.resolveChildForItem !== 'function') {
        subscriber.complete()
        return
      }

      subscribeForUpdates(parent.resolveChildForItem(id, parent, {index}), index)
    }

    function subscribeForUpdates(pane, index) {
      const source = isSubscribable(pane) ? from(pane) : observableOf(pane)
      subscriptions.push(
        source.subscribe(result => emit(result, index), error => subscriber.error(error))
      )
    }

    function emit(pane, index) {
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
