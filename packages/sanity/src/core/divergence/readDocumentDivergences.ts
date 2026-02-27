import {isKeyedObject, type KeyedObject, type Path, type SanityDocument} from '@sanity/types'
import {fromString, startsWith, toString} from '@sanity/util/paths'
import {get} from 'lodash-es'
import {
  combineLatest,
  EMPTY,
  filter,
  first,
  from,
  map,
  merge,
  mergeMap,
  type Observable,
  of,
  type OperatorFunction,
  pipe,
  reduce,
  switchMap,
  takeWhile,
  tap,
  toArray,
  zipWith,
} from 'rxjs'

import {isRecord} from '../util/isRecord'
import {selectEffect} from './selectEffect'
import {selectEffectFromHash} from './selectEffectFromHash'
import {type ResolutionMarker} from './types/ResolutionMarker'
import {delayTask} from './utils/delayTask'
import {findMovesInArrayOfObjects} from './utils/findMovesInArrayOfObjects'
import {type FlattenedPair, flattenObject, type PathWithTypes} from './utils/flatten'
import {hashData} from './utils/hashData'

/**
 * @internal
 */
export interface FindDivergencesContext {
  upstreamHead: SanityDocument
  subjectHead: SanityDocument
  upstreamAtFork: SanityDocument
  resolutions?: {
    _key: string
    resolutionMarker: ResolutionMarker
  }[]
}

type DivergenceStatus = 'unresolved' | 'resolved'

/**
 * @internal
 */
export type ResolutionMarkerAtPath = [path: string, resolutionMarker: ResolutionMarker]

type SnapshotType = 'subjectHead' | 'upstreamHead' | 'upstreamAtFork'

type SnapshotsByType = Record<
  SnapshotType,
  | undefined
  | {
      value: unknown

      /**
       * If the node is a direct descendant of an array, `parentArray` can be used to access all of
       * the parent array's descendants. This is used to determine the movement of array nodes.
       */
      parentArray?: KeyedObject[] | unknown[]

      /**
       * If the node is a direct descendant of an object, this can be used to determine the parent
       * object's type. This is used to determine objects whose type has changed.
       */
      parentObjectType?: string

      /**
       * The node's path as an array, enriched with the content type found at each segment.
       */
      pathWithTypes: PathWithTypes
    }
>

type DivergenceDetectionStrategy = 'sinceFork' | 'sinceResolution'

/**
 * @internal
 */
export type DivergenceEffect = 'unset' | 'set' | 'insert' | 'move' | 'changeObjectType'

/**
 * @internal
 */
export type BaseDivergence = {
  snapshots: SnapshotsByType
  documentType: string

  /**
   * Whether the divergence is addressable.
   *
   * Divergences that occur at leaf primitive nodes are addressable. Addressable divergences can be
   * marked as resolved.
   */
  isAddressable: boolean

  /**
   * The type of operation that occurred upstream to cause the divergence.
   */
  effect?: DivergenceEffect

  /**
   * The upstream document id.
   */
  documentId: string

  /**
   * The subject document id.
   */
  subjectId: string

  /**
   * The upstream revision that caused the divergence.
   */
  sinceRevisionId: string

  /**
   * Whether the divergence has been resolved or not.
   */
  status: DivergenceStatus

  /**
   * The stringified path to the divergence in the document.
   *
   * TODO: It'd be more efficient to provide this as an array to avoid repeatedly converting it to
   *       and from a string.
   */
  path: string
}

/**
 * @internal
 */
export type Divergence = BaseDivergence &
  (
    | {
        effect: Exclude<DivergenceEffect, 'move'>
      }
    | {
        effect: Extract<DivergenceEffect, 'move'>

        /**
         * The position of the item in the upstream array.
         */
        upstreamPosition: number

        /**
         * The distance the item has moved in the upstream array since the last consistent state.
         */
        delta: number
      }
    | {
        effect: Extract<DivergenceEffect, 'insert'>

        /**
         * The position at which the item was inserted inro the upstream array.
         */
        position: number
      }
    | {
        effect?: undefined
        delta?: never
        position?: never
      }
  )

export type DivergenceAtPath = [path: string, context: Divergence]

// Fields that are never considered divergent.
// TODO: Remove `_xSystem` from regex.
const skipFields = /(\.|^)_(id|rev|key|system|createdAt|updatedAt|xSystem)(\.|$)/g

type State = Record<string, SnapshotsByType>

/**
 * @internal
 */
export function readDocumentDivergences({
  upstreamAtFork,
  upstreamHead,
  subjectHead,
  resolutions = [],
}: FindDivergencesContext): Observable<DivergenceAtPath> {
  if (
    typeof subjectHead === 'undefined' ||
    typeof upstreamHead === 'undefined' ||
    typeof upstreamAtFork === 'undefined'
  ) {
    return EMPTY
  }

  const markName = [subjectHead._id, upstreamHead._id, upstreamAtFork._id].join('.')

  performance.mark(markName)

  const instance: Observable<DivergenceAtPath> = merge<[SnapshotType, FlattenedPair][]>(
    from(flattenObject(subjectHead)).pipe(
      map((entry) => ['subjectHead', entry] satisfies [SnapshotType, FlattenedPair]),
    ),
    from(flattenObject(upstreamHead)).pipe(
      map((entry) => ['upstreamHead', entry] satisfies [SnapshotType, FlattenedPair]),
    ),
    from(flattenObject(upstreamAtFork)).pipe(
      map((entry) => ['upstreamAtFork', entry] satisfies [SnapshotType, FlattenedPair]),
    ),
  )
    .pipe(
      map(([snapshotType, [path, value, context]]) => ({
        snapshotType,
        path,
        value,
        context,
      })),
      filter(({path}) => !path.match(skipFields)),
      aggregateArrays(),
      aggregateObjects(),
      reduce((state, {snapshotType, path, value, arrays, objects, context}): State => {
        state[path] ??= {
          subjectHead: undefined,
          upstreamHead: undefined,
          upstreamAtFork: undefined,
        }

        const parentPathArray = toString(context.flatPathArray.slice(0, -1))
        const parentArray = arrays[parentPathArray]
        const parentObject = objects[parentPathArray]

        state[path][snapshotType] = {
          value,
          parentArray,
          parentObjectType: get(parentObject, '_type'),
          pathWithTypes: context.flatPathArrayWithTypes,
        }

        return state
      }, {}),
      tap(() => {
        performance.measure(markName, {
          start: markName,
          detail: {
            devtools: {
              dataType: 'track-entry',
              track: 'Iterate all versions',
              trackGroup: 'Find divergences',
              color: 'tertiary-dark',
            },
          },
        })
      }),
      switchMap((state) => from(Object.entries(state))),
      switchMap(([path, snapshots]) =>
        from(resolutions).pipe(
          first(({_key}) => _key === path, {resolutionMarker: undefined}),
          map(({resolutionMarker}) => resolutionMarker),
          map((resolutionMarker) => ({path, snapshots, resolutionMarker})),
        ),
      ),
    )
    .pipe(
      delayTask(),
      mergeMap<
        {
          path: string
          snapshots: SnapshotsByType
          resolutionMarker: ResolutionMarker | undefined
        },
        Observable<DivergenceAtPath>
      >(({path, snapshots, resolutionMarker}) => {
        const strategy: DivergenceDetectionStrategy =
          typeof resolutionMarker === 'undefined' ? 'sinceFork' : 'sinceResolution'

        if (isRevisionIdEqual({strategy, upstreamAtFork, upstreamHead, resolutionMarker})) {
          // The entire document is unchanged since resolution: the divergence remains resolved.
          if (strategy === 'sinceResolution') {
            return of<DivergenceAtPath>([
              path,
              {
                status: 'resolved',
                isAddressable: false,
                documentId: upstreamHead._id,
                documentType: subjectHead._type,
                subjectId: subjectHead._id,
                path: path,
                snapshots,
                sinceRevisionId: upstreamHead._rev,
              },
            ])
          }

          // The entire document is unchanged since fork: there are no divergences.
          return EMPTY
        }

        // Divergences aren't usually reported at the object level, but instead for leaf primitive
        // nodes.
        //
        // However, the position of an object in an array *can* diverge. This causes a divergence of
        // the object istelf, with the "move" effect.
        if (
          isPositionedNode({
            strategy,
            snapshots,
            resolutionMarker,
          })
        ) {
          const [upstreamBaseIndex, upstreamHeadIndex] = getPositionedNodeIndexes({
            strategy,
            snapshots,
            resolutionMarker,
          })

          return of(upstreamHeadIndex - upstreamBaseIndex).pipe(
            // Position has changed in upstream.
            filter((moveInUpstream) => moveInUpstream !== 0),
            delayTask(),
            zipWith(
              isObjectArray(snapshots.subjectHead?.parentArray) &&
                isObjectArray(snapshots.upstreamHead?.parentArray)
                ? findMovesInArrayOfObjects(
                    snapshots.subjectHead.parentArray,
                    snapshots.upstreamHead?.parentArray,
                  )
                : of<Record<string, number>>({}),
            ),
            map(([movesInUpstream, movesInSubject]): [number, number | undefined] => {
              const key =
                get(snapshots, ['upstreamAtFork', 'value', '_key']) ??
                get(snapshots, ['upstreamHead', 'value', '_key'])

              return [movesInUpstream, movesInSubject[key]]
            }),
            filter((moves): moves is [number, number] => {
              const [, moveInSubject] = moves
              return typeof moveInSubject !== 'undefined'
            }),
            map(
              ([, positionDelta]): DivergenceAtPath => [
                path,
                {
                  documentId: upstreamHead._id,
                  documentType: subjectHead._type,
                  subjectId: subjectHead._id,
                  status: 'unresolved',
                  isAddressable: true,
                  effect: 'move',
                  delta: positionDelta,
                  upstreamPosition: upstreamHeadIndex,
                  sinceRevisionId: upstreamAtFork?._rev,
                  path: path,
                  snapshots,
                },
              ],
            ),
          )
        }

        if (strategy === 'sinceFork') {
          const sinceForkMarkName = ['sinceFork', markName, path].join('.')
          performance.mark(sinceForkMarkName)

          return combineLatest({
            upstreamAtFork: from(hashData(snapshots.upstreamAtFork?.value)),
            upstreamHead: from(hashData(snapshots.upstreamHead?.value)),
            subjectHead: from(hashData(snapshots.subjectHead?.value)),
          }).pipe(
            tap(() => {
              performance.measure(path, {
                start: sinceForkMarkName,
                detail: {
                  devtools: {
                    dataType: 'track-entry',
                    track: 'Hash snapshots',
                    trackGroup: 'Find divergences',
                    color: 'tertiary-dark',
                    properties: [
                      ['Upstream at fork', snapshots.upstreamAtFork?.value],
                      ['Upstream head', snapshots.upstreamHead?.value],
                      ['Subject head', snapshots.subjectHead?.value],
                      ['Strategy', strategy],
                    ],
                  },
                },
              })
            }),
            delayTask(),
            map((hashes) => ({
              hashes,
              effect: selectEffect({
                fromValue: snapshots.upstreamAtFork?.value,
                toValue: snapshots.upstreamHead?.value,
                upstreamParent: snapshots.upstreamHead?.parentArray,
                path,
              }),
            })),
            // The upstream has changed since the fork occurred.
            takeWhile(
              ({hashes, effect}) =>
                effect === 'insert' ||
                effect === 'unset' ||
                hashes.upstreamAtFork !== hashes.upstreamHead,
            ),
            // The upstream is different to the current value in the subject document.
            takeWhile(
              ({hashes, effect}) =>
                effect === 'insert' ||
                effect === 'unset' ||
                hashes.upstreamHead !== hashes.subjectHead,
            ),
            // If the node is an inserted object array item, and it already exists in the subject
            // document, skip it.
            takeWhile(
              ({effect}) =>
                effect !== 'insert' ||
                typeof snapshots.subjectHead?.parentArray?.find((item) => {
                  const parentPathSegment = fromString(path).at(-1)
                  return isKeyedObject(item) && item._key === get(parentPathSegment, '_key')
                }) === 'undefined',
            ),
            takeWhile(() => {
              const isArray = [snapshots.upstreamAtFork?.value, snapshots.upstreamHead?.value].some(
                Array.isArray,
              )
              return !isArray
            }),
            map(({effect}): DivergenceAtPath => {
              const hasObjectSnapshot = [
                snapshots.upstreamAtFork?.value,
                snapshots.upstreamHead?.value,
              ].some(isRecord)

              const hasKeyedObjectSnapshot = [
                snapshots.upstreamAtFork?.value,
                snapshots.upstreamHead?.value,
              ].some(isKeyedObject)

              const hasArraySnapshot = [
                snapshots.upstreamAtFork?.value,
                snapshots.upstreamHead?.value,
              ].some(Array.isArray)

              const hasNullSnapshot = [
                snapshots.upstreamAtFork?.value,
                snapshots.upstreamHead?.value,
              ].some((value) => value === null)

              const isAddressable =
                (!hasObjectSnapshot && !hasArraySnapshot) ||
                hasKeyedObjectSnapshot ||
                (hasNullSnapshot && !hasObjectSnapshot && !hasArraySnapshot)

              const divergence = {
                documentId: upstreamHead._id,
                documentType: subjectHead._type,
                subjectId: subjectHead._id,
                status: 'unresolved',
                isAddressable,
                effect,
                sinceRevisionId: upstreamAtFork?._rev,
                path,
                snapshots,
              } satisfies BaseDivergence

              // Item inserted into object array.
              if (divergence.effect === 'insert') {
                return [
                  path,
                  {
                    ...divergence,
                    position:
                      findPositionedNodeIndexByKey(
                        snapshots.upstreamHead?.parentArray,
                        get(snapshots, ['upstreamHead', 'value', '_key']),
                      ) ?? 0,
                  },
                ]
              }

              return [path, divergence]
            }),
          )
        }

        if (strategy === 'sinceResolution') {
          if (typeof resolutionMarker === 'undefined') {
            throw new Error('Expected resolution marker')
          }

          const sinceResolutionMarkName = ['sinceResolution', markName, path].join('.')
          performance.mark(sinceResolutionMarkName)

          return combineLatest({
            upstreamHead: from(hashData(snapshots.upstreamHead?.value)),
            subjectHead: from(hashData(snapshots.subjectHead?.value)),
          }).pipe(
            tap(() => {
              performance.measure(path, {
                start: sinceResolutionMarkName,
                detail: {
                  devtools: {
                    dataType: 'track-entry',
                    track: 'Hash snapshots',
                    trackGroup: 'Find divergences',
                    color: 'tertiary-dark',
                    properties: [
                      ['Upstream at fork', snapshots.upstreamAtFork?.value],
                      ['Upstream head', snapshots.upstreamHead?.value],
                      ['Subject head', snapshots.subjectHead?.value],
                      ['Strategy', strategy],
                    ],
                  },
                },
              })
            }),
            delayTask(),
            map(
              (hashes): DivergenceAtPath => [
                path,
                {
                  documentId: upstreamHead._id,
                  documentType: subjectHead._type,
                  subjectId: subjectHead._id,
                  path: path,
                  snapshots,
                  status:
                    // The upstream has not changed since the resolution.
                    hashes.upstreamHead === resolutionMarker[1] ||
                    // The upstream is not different to the current value in the subject document.
                    hashes.upstreamHead === hashes.subjectHead
                      ? 'resolved'
                      : 'unresolved',
                  // A resolution already exists for the node, so it can be assumed the divergence
                  // is addressable.
                  isAddressable: true,
                  effect: selectEffectFromHash({
                    fromHash: resolutionMarker[1],
                    toHash: hashes.upstreamHead,
                    upstreamParentIsArray: Array.isArray(snapshots.upstreamHead),
                    path,
                  }),
                  sinceRevisionId: resolutionMarker[0],
                },
              ],
            ),
          )
        }

        return EMPTY
      }),
      coalesceChangedObjectTypes(),
    )

  return instance
}

function isPositionedNode({
  strategy,
  snapshots,
  resolutionMarker,
}: {
  strategy: DivergenceDetectionStrategy
  snapshots: SnapshotsByType
  resolutionMarker?: ResolutionMarker
}): boolean {
  if (strategy === 'sinceFork') {
    return (
      isKeyedObject(snapshots.upstreamAtFork?.value) && isKeyedObject(snapshots.upstreamHead?.value)
    )
  }

  if (strategy === 'sinceResolution') {
    if (typeof resolutionMarker === 'undefined') {
      throw new Error('Expected resolution marker')
    }

    return isKeyedObject(snapshots.upstreamHead?.value)
  }

  throw new Error(`Unexpected strategy: "${strategy}"`)
}

function getPositionedNodeIndexes({
  strategy,
  snapshots,
  resolutionMarker,
}: {
  strategy: DivergenceDetectionStrategy
  snapshots: SnapshotsByType
  resolutionMarker?: ResolutionMarker
}): [UpstreamBaseIndex: number, UpstreamHeadIndex: number] {
  const key =
    get(snapshots, ['upstreamAtFork', 'value', '_key']) ??
    get(snapshots, ['upstreamHead', 'value', '_key'])

  if (strategy === 'sinceFork') {
    return [
      findPositionedNodeIndexByKey(snapshots.upstreamAtFork?.parentArray, key),
      findPositionedNodeIndexByKey(snapshots.upstreamHead?.parentArray, key),
    ]
  }

  if (strategy === 'sinceResolution') {
    if (typeof resolutionMarker === 'undefined') {
      throw new Error('Expected resolution marker')
    }

    if (typeof resolutionMarker[1] !== 'number') {
      throw new Error('Expected upstream position at resolution as number, but received string')
    }

    return [
      resolutionMarker[1],
      findPositionedNodeIndexByKey(snapshots.upstreamHead?.parentArray, key),
    ]
  }

  throw new Error(`Unexpected strategy: "${strategy}"`)
}

function aggregateArrays<
  Input extends {
    snapshotType: SnapshotType
    path: string
    value: unknown
  },
>(): OperatorFunction<Input, Input & {arrays: Record<string, unknown[]>}> {
  const arrays: Record<string, unknown[]> = {}

  return switchMap((entry) => {
    if (Array.isArray(entry.value)) {
      arrays[entry.path] = entry.value
    }

    return of({...entry, arrays})
  })
}

function aggregateObjects<
  Input extends {
    snapshotType: SnapshotType
    path: string
    value: unknown
  },
>(): OperatorFunction<Input, Input & {objects: Record<string, SanityObjectLike>}> {
  const objects: Record<string, SanityObjectLike> = {}

  return switchMap((entry) => {
    if (isSanityObjectLike(entry.value)) {
      objects[entry.path] = entry.value
    }

    return of({...entry, objects})
  })
}

/**
 * If an object type has changed since its last consistent state, the object's descendant nodes are
 * no longer guaranteed to be compatible. This is most likely to occur in arrays of objects, because
 * they allow polymorphism.
 *
 * An object's type is unlikely to change due to an operation performed by an editor in Studio,
 * but this can occur when scripting or using an agent to update content.
 *
 * This operator:
 *
 *  1. Finds any object whose type has changed.
 *  2. Filters all divergences that affect descendants of the changed object.
 *  3. Emits a single divergence for the object itself.
 */
function coalesceChangedObjectTypes(): OperatorFunction<DivergenceAtPath, DivergenceAtPath> {
  const changedObjectPaths: Path[] = []

  return pipe(
    toArray(),
    // Ensure the object's `_type` field is iterated first.
    switchMap((divergences) => {
      return from(
        divergences.sort(([pathA], [pathB]) => {
          const pathArrayA = fromString(pathA)
          const pathArrayB = fromString(pathB)

          if (pathArrayA.at(-1) === '_type' && pathArrayB.at(-1) !== '_type') {
            return -1
          }

          if (pathArrayA.at(-1) !== '_type' && pathArrayB.at(-1) === '_type') {
            return 1
          }

          return 0
        }),
      )
    }),
    mergeMap<DivergenceAtPath, Observable<DivergenceAtPath>>(([path, divergence]) => {
      const descendsChangedTypeObject = changedObjectPaths.some((changedObjectPath) =>
        startsWith(changedObjectPath, fromString(path)),
      )

      if (descendsChangedTypeObject) {
        return EMPTY
      }

      const pathArray = fromString(path)
      const parentObjectPath = pathArray.slice(0, -1)

      // Whether the object's current state in the upstream can be meaningfully compared with its
      // current state in the subject.
      const isSubjectObjectTypeCompatible =
        divergence.snapshots.upstreamHead?.parentObjectType ===
        divergence.snapshots.subjectHead?.parentObjectType

      // Whether the object's type has changed in the upstream. It indicates whether the last
      // consistent state of the object can be meaninfully compared with the current state of the
      // object in the upstream.
      const isChangedObjectType = divergence.effect === 'changeObjectType'

      const isFirstDescendantOfChangedObject = !changedObjectPaths.some(
        (changedObjectPath) => toString(changedObjectPath) === toString(parentObjectPath),
      )

      // When encountering the first node in an object that has changed type, emit a divergence on
      // the object itself, and suppress any other divergences affecting descendants of the object.
      if (
        isChangedObjectType ||
        (!isSubjectObjectTypeCompatible && isFirstDescendantOfChangedObject)
      ) {
        changedObjectPaths.push(parentObjectPath)

        return of<DivergenceAtPath>([
          toString(parentObjectPath),
          {
            // Note: `snapshots` currently reflects the `_type` node, or first descendant node
            // encountered, rather than the object itself.
            ...divergence,
            effect: 'changeObjectType',
            isAddressable: true,
            path: toString(parentObjectPath),
          },
        ])
      }

      return of([path, divergence])
    }),
  )
}

function findPositionedNodeIndexByKey(array: unknown[] = [], key: string | undefined): number {
  return array.findIndex((value) => {
    if (typeof value !== 'object' || value === null || !('_key' in value)) {
      return false
    }

    return value._key === key
  })
}

function isRevisionIdEqual({
  strategy,
  upstreamAtFork,
  upstreamHead,
  resolutionMarker,
}: {
  strategy: DivergenceDetectionStrategy
  upstreamAtFork: SanityDocument
  upstreamHead: SanityDocument
  resolutionMarker?: ResolutionMarker
}): boolean {
  if (strategy === 'sinceResolution') {
    if (typeof resolutionMarker === 'undefined') {
      throw new Error('Expected resolution marker')
    }

    return upstreamHead._rev === resolutionMarker[0]
  }

  if (strategy === 'sinceFork') {
    return upstreamAtFork?._rev === upstreamHead._rev
  }

  throw new Error(`Unexpected strategy: "${strategy}"`)
}

function isObjectArray(maybeObjectArray: unknown): maybeObjectArray is KeyedObject[] {
  if (Array.isArray(maybeObjectArray)) {
    return maybeObjectArray.some(isKeyedObject)
  }
  return false
}

interface SanityObjectLike {
  _type: string
  [key: string]: unknown
}

function isSanityObjectLike(
  maybeSanityObjectLike: unknown,
): maybeSanityObjectLike is SanityObjectLike {
  return (
    typeof maybeSanityObjectLike === 'object' &&
    maybeSanityObjectLike !== null &&
    '_type' in maybeSanityObjectLike
  )
}
