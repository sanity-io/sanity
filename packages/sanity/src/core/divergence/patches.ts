import {append, at, type NodePatch, type Path, set, setIfMissing, unset} from '@sanity/mutate'
import {type Path as SanityPath, type SanityDocument} from '@sanity/types'
import {fromString, isEqual, startsWith} from '@sanity/util/paths'
import {EMPTY, first, from, map, mergeMap, type Observable, of} from 'rxjs'

import {type DivergenceAtPath} from './readDocumentDivergences'
import {type ResolutionMarkerAtPath} from './types/ResolutionMarker'
import {flattenObject} from './utils/flatten'

const SYSTEM_PATH = '_systemDivergences'
const DIVERGENCE_RESOLUTION_PATH = [SYSTEM_PATH, 'resolutions'] as const satisfies Path
const DEFAULT_VALUES = [{}, []]

/**
 * Create patches to set the provided resolution markers on the subject version,
 * ensuring the necessary `_systemDivergences` field exists.
 *
 * @internal
 */
export function createUpsertResolutionMarkerPatches(
  ...resolutionMarkers: ResolutionMarkerAtPath[]
): NodePatch[] {
  const upsertSystem = DIVERGENCE_RESOLUTION_PATH.map((segment, index, array) =>
    array.slice(0, index).concat(segment),
  ).map((path, index) => at(path, setIfMissing(DEFAULT_VALUES[index])))

  const setResolutionMarkers = resolutionMarkers.flatMap(([path, resolutionMarker]) => [
    at([...DIVERGENCE_RESOLUTION_PATH, {_key: path}], unset()),
    at(
      DIVERGENCE_RESOLUTION_PATH,
      append([
        {
          _key: path,
          resolutionMarker,
        },
      ]),
    ),
  ])

  return [...upsertSystem, ...setResolutionMarkers]
}

/**
 * Resolve an array of divergences by taking their upstream value.
 *
 * @internal
 */
export function createTakeFromUpstreamPatches(
  source: SanityDocument,
  allDivergences: DivergenceAtPath[],
  ...paths: SanityPath[]
): Observable<NodePatch> {
  return from(allDivergences).pipe(
    mergeMap(([divergencePath, divergence]) => {
      const divergencePathSegments = fromString(divergencePath)

      // Set ancestoral or sibling object `_type`.
      if (divergence.effect === 'set' && divergencePathSegments.at(-1) === '_type') {
        const isAncestorOrSibling = paths.some((acceptedPath) => {
          return (
            acceptedPath.length > divergencePathSegments.length - 1 &&
            startsWith(divergencePathSegments.slice(0, -1), acceptedPath) &&
            !isEqual(divergencePathSegments, acceptedPath)
          )
        })

        if (isAncestorOrSibling) {
          return from(flattenObject(source)).pipe(
            first(([nodeFlatPath]) => nodeFlatPath === divergencePath),
            map(([, value]) => value),
            map((value) => at(divergencePath, set(value))),
          )
        }
      }

      // Divergence not selected for copy.
      if (typeof paths.find((path) => isEqual(path, divergencePathSegments)) === 'undefined') {
        return EMPTY
      }

      if (divergence.effect === 'insert') {
        // TODO: Support array insertions.
        throw new Error('Array insertions not supported')
      }

      if (divergence.effect === 'unset') {
        return of(at(divergencePath, unset()))
      }

      if (divergence.effect === 'set') {
        return from(flattenObject(source)).pipe(
          first(([nodeFlatPath]) => nodeFlatPath === divergencePath),
          map(([, value]) => value),
          map((value) => at(divergencePath, set(value))),
        )
      }

      return EMPTY
    }),
  )
}
