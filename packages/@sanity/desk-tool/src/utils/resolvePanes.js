import {useEffect, useState} from 'react'
import shallowEquals from 'shallow-equals'
import {Observable, defer, throwError, from, of as observableOf} from 'rxjs'
import {map, switchMap, distinctUntilChanged} from 'rxjs/operators'
import leven from 'leven'
import {LOADING_PANE} from '../constants'
import defaultStructure from '../defaultStructure'
import isSubscribable from './isSubscribable'
import validateStructure from './validateStructure'
import serializeStructure from './serializeStructure'
import generateHelpUrl from '@sanity/generate-help-url'

const KNOWN_STRUCTURE_EXPORTS = ['getDefaultDocumentNode']

let prevStructureError = null
if (__DEV__) {
  if (module.hot && module.hot.data) {
    prevStructureError = module.hot.data.prevError
  }

  if (module.hot) {
    module.hot.dispose(data => {
      data.prevError = prevStructureError
    })
  }
}

export function resolvePanes(structure, paneGroups, prevStructure, fromIndex, options) {
  const waitStructure = isSubscribable(structure) ? from(structure) : observableOf(structure)
  return waitStructure.pipe(
    switchMap(struct => resolveForStructure(struct, paneGroups, prevStructure, fromIndex, options))
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

function resolveForStructure(structure, paneGroups, prevStructure, fromIndex, options = {}) {
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
        const {id} = siblings[i]
        const isFallbackEditor = index === 1 && id.startsWith('__edit__')
        const child = isFallbackEditor ? resolveFallbackEditor : parent.child
        const resolverArgs = getResolverArgumentsForSibling(siblings[i], context, isFallbackEditor)
        subscribeForUpdates(child, index, i, context, resolverArgs)
      }
    }

    function getResolverArgumentsForSibling(sibling, context, isFallbackEditor) {
      const {id, params, payload} = sibling
      return isFallbackEditor ? [id, context, {params, payload}] : [id, context]
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
      if (typeof pane === 'undefined' && !options.silent) {
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

    function resolveFallbackEditor(nodeId, context, {params, payload}) {
      const id = nodeId.replace(/^__edit__/, '')
      const {template, type} = params

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

export const maybeSerialize = structure =>
  structure && typeof structure.serialize === 'function'
    ? structure.serialize({path: []})
    : structure

// We are lazy-requiring/resolving the structure inside of a function in order to catch errors
// on the root-level of the module. Any loading errors will be caught and emitted as errors
// eslint-disable-next-line complexity
export const loadStructure = () => {
  let structure
  try {
    const mod = require('part:@sanity/desk-tool/structure?') || defaultStructure
    structure = mod && mod.__esModule ? mod.default : mod

    warnOnUnknownExports(mod)

    // On invalid modules, when HMR kicks in, we sometimes get an empty object back when the
    // source has changed without fixing the problem. In this case, keep showing the error
    if (
      __DEV__ &&
      prevStructureError &&
      structure &&
      structure.constructor.name === 'Object' &&
      Object.keys(structure).length === 0
    ) {
      return throwError(prevStructureError)
    }

    prevStructureError = null
  } catch (err) {
    prevStructureError = err
    return throwError(err)
  }

  if (!isStructure(structure)) {
    return throwError(
      new Error(
        `Structure needs to export a function, an observable, a promise or a stucture builder, got ${typeof structure}`
      )
    )
  }

  // Defer to catch immediately thrown errors on serialization
  return defer(() => serializeStructure(structure))
}

export const useStructure = (segments, options = {}) => {
  const hasSegments = Boolean(segments)
  const numSegments = sumPaneSegments(segments || [])
  const [{structure, error}, setStructure] = useState({structure: null, error: null})

  // @todo This leads to deep update loops unless we serialize paneSegments
  // @todo We should try to memoize/prevent this without resorting to JSON.stringify
  useEffect(() => {
    if (!hasSegments) {
      return () => null
    }

    setStructure({structure: getInitialPanes(null, numSegments, 0)})
    const subscription = loadStructure()
      .pipe(
        distinctUntilChanged(),
        map(maybeSerialize),
        switchMap(newStructure => resolvePanes(newStructure, segments, structure, [0, 0], options))
      )
      .subscribe(
        newStructure => setStructure({structure: newStructure}),
        resolveError => setStructure({error: resolveError})
      )

    return () => subscription.unsubscribe()
  }, [JSON.stringify(segments)])

  return {structure, error}
}

export const setStructureResolveError = err => {
  prevStructureError = err
}

function isStructure(structure) {
  return (
    structure &&
    (typeof structure === 'function' ||
      typeof structure.serialize !== 'function' ||
      typeof structure.then !== 'function' ||
      typeof structure.subscribe !== 'function' ||
      typeof structure.type !== 'string')
  )
}

function warnOnUnknownExports(mod) {
  if (!mod) {
    return
  }

  const known = KNOWN_STRUCTURE_EXPORTS.concat('default')
  const keys = Object.keys(mod)
  keys
    .filter(key => !known.includes(key))
    .forEach(key => {
      const {closest} = known.reduce(
        (acc, current) => {
          const distance = leven(current, key)
          return distance < 3 && distance < acc.distance ? {closest: current, distance} : acc
        },
        {closest: null, distance: +Infinity}
      )

      const hint = closest ? ` - did you mean "${closest}"` : ''

      // eslint-disable-next-line
      console.warn(`Unknown structure export "${key}"${hint}`)
    })
}
