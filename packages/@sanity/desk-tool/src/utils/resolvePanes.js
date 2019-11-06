import shallowEquals from 'shallow-equals'
import {Observable, from, of as observableOf} from 'rxjs'
import {switchMap} from 'rxjs/operators'
import {LOADING_PANE} from '../index'
import isSubscribable from './isSubscribable'
import validateStructure from './validateStructure'
import serializeStructure from './serializeStructure'
import generateHelpUrl from '@sanity/generate-help-url'

// eslint-disable-next-line import/prefer-default-export
export function resolvePanes(structure, paneGroups, prevStructure, fromIndex) {
  const waitStructure = isSubscribable(structure) ? from(structure) : observableOf(structure)
  return waitStructure.pipe(
    switchMap(struct => resolveForStructure(struct, paneGroups, prevStructure, fromIndex))
  )
}

function getInitialPanes(prevStructure, numPanes, fromIndex) {
  const allLoading = new Array(numPanes).fill(LOADING_PANE)
  if (!prevStructure) {
    return allLoading
  }

  const remains = prevStructure.slice(0, fromIndex)
  return remains.concat(allLoading.slice(fromIndex))
}

function sumPaneSegments(paneGroups) {
  return paneGroups.reduce((count, curr) => count + curr.length, 0)
}

function resolveForStructure(structure, paneGroups, prevStructure, fromIndex) {
  return Observable.create(subscriber => {
    try {
      validateStructure(structure)
    } catch (err) {
      subscriber.error(err)
      return unsubscribe
    }

    const paneSegments = [[{id: structure.id}]]
      .concat(paneGroups)
      .filter(pair => pair && pair.length > 0)

    const totalPanes = sumPaneSegments(paneSegments)
    const [fromRootIndex, fromSplitIndex] = fromIndex
    let panes = getInitialPanes(prevStructure, totalPanes, fromRootIndex + 1 + fromSplitIndex)
    const subscriptions = []

    // Start with all-loading (or previous structure) state
    subscriber.next(panes)

    const resolveFrom = Math.max(0, panes.indexOf(LOADING_PANE))
    const resolveFromIndex = findSegmentGroupIndexForPaneAtIndex(resolveFrom)

    // Start resolving pane-by-pane
    resolve(resolveFromIndex, fromSplitIndex || 0)

    return unsubscribe

    function resolve(index, splitIndex) {
      if (index > paneSegments.length - 1) {
        return
      }

      // @todo Path is incorrect (array of groups vs ids), is it being used anywhere?
      const parent = index === 0 ? null : findParentForSegmentIndex(index - 1)
      const path = paneSegments.slice(0, index + 1).map(segment => segment[0].id)
      const context = {parent, index, splitIndex, path}

      if (index === 0) {
        const {id} = paneSegments[index][splitIndex]
        subscribeForUpdates(structure, index, 0, context, [id, context])
        return
      }

      if (!parent || !parent.child) {
        return
      }

      const siblings = paneSegments[index]
      for (let i = splitIndex; i < siblings.length; i++) {
        // @todo add split index to path?
        const {id} = siblings[i]
        const isFallbackEditor = index === 1 && id === '__edit__'
        const child = isFallbackEditor ? resolveFallbackEditor : parent.child
        subscribeForUpdates(child, index, i, context, [id, context])
      }
    }

    function subscribeForUpdates(pane, index, splitIndex, context, resolverArgs) {
      const source = serializeStructure(pane, context, resolverArgs)
      subscriptions.push(
        source.subscribe(
          result => emit(result, index, splitIndex),
          error => subscriber.error(error)
        )
      )
    }

    function findSegmentGroupIndexForPaneAtIndex(index) {
      for (let i = 0, pane = 0; i < paneSegments.length; i++) {
        for (let x = 0; x < paneSegments[i].length; x++) {
          // eslint-disable-next-line max-depth
          if (pane === index) {
            return i
          }

          pane++
        }
      }

      return null
    }

    function findFlatIndexForPane(index, splitIndex) {
      if (index === 0) {
        return splitIndex
      }

      let flatIndex = 0
      for (let i = 0; index < paneSegments.length && i <= index; i++) {
        if (i === index) {
          return flatIndex + splitIndex
        }

        flatIndex += paneSegments[i].length
      }

      return null
    }

    function findParentForSegmentIndex(index) {
      const parentGroupIndex = findSegmentGroupIndexForPaneAtIndex(index)
      return parentGroupIndex === null ? null : panes[parentGroupIndex]
    }

    function emit(pane, index, splitIndex) {
      if (typeof pane === 'undefined') {
        // eslint-disable-next-line no-console
        console.warn(
          'Pane at index %d returned no child %s - see %s',
          index,
          splitIndex ? `for split pane index ${splitIndex}` : '',
          generateHelpUrl('structure-item-returned-no-child')
        )
      }

      if (maybeReplacePane(pane, index, splitIndex)) {
        subscriber.next(panes) // eslint-disable-line callback-return
      }

      if (splitIndex === 0) {
        resolve(index + 1, splitIndex)
      }
    }

    function maybeReplacePane(pane, index, splitIndex) {
      // `panes` are flat: so we need to figure out the correct index based on the groups
      const flatIndex = findFlatIndexForPane(index, splitIndex)
      if (panes[flatIndex] === pane || shallowEquals(panes[flatIndex], pane)) {
        return false
      }

      panes = panes.slice()
      if (pane) {
        panes.splice(flatIndex, 1, pane)
      } else {
        panes.splice(flatIndex)
      }

      return true
    }

    function resolveFallbackEditor(nodeId, context) {
      const {params, payload} = context
      const {id, template, type} = params

      return {
        id: 'editor',
        type: 'document',
        options: {id, template, type, templateParameters: payload}
      }
    }

    function unsubscribe() {
      while (subscriptions.length) {
        subscriptions.pop().unsubscribe()
      }
    }
  })
}
