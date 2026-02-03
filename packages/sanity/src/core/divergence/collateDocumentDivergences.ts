import {isEqual} from 'lodash-es'
import QuickLRU from 'quick-lru'
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  mergeMap,
  type Observable,
  of,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  switchScan,
  tap,
  toArray,
} from 'rxjs'

import {
  type Divergence,
  type DivergenceAtPath,
  type FindDivergencesContext,
  readDocumentDivergences,
} from './readDocumentDivergences'
import {delayTask} from './utils/delayTask'

export interface CollatedDocumentDivergencesState {
  state: 'pending' | 'ready'
  divergences: Record<string, Divergence>
}

interface Instance {
  observable: Observable<CollatedDocumentDivergencesState>
  context: Subject<FindDivergencesContext>
}

interface CollatedDocumentDivergencesContext {
  upstreamId: string
  subjectId: string
}

const DEBOUNCE_DURATION = 1_000
const CACHE_MAX_SIZE = 10

let cacheWriteChannel: Subject<string>
let cache: QuickLRU<string, Instance>

/**
 * @internal
 */
export const collateDocumentDivergencesInitialState: CollatedDocumentDivergencesState = {
  state: 'pending',
  divergences: {},
}

/**
 * Collate all divergences in a single document.
 *
 * For each upstream id and subject id pair, the instance is cached globally in a LRU store.
 * Computation is throttled, and yields to the main thread to minimise blocking of the UI.
 *
 * The consumer is responsible for providing the data this computation depends on
 * (`FindDivergencesContext`). If any of the underlying context changes, recomputation can be
 * triggered by writing the updated context to the returned `context` subject.
 *
 * @internal
 */
export function collateDocumentDivergences({
  upstreamId,
  subjectId,
}: CollatedDocumentDivergencesContext): Instance {
  initialiseCache()

  const cacheKey = getCacheKey({upstreamId, subjectId})
  const cachedInstance = cache.get(cacheKey)

  if (typeof cachedInstance !== 'undefined') {
    return cachedInstance
  }

  const context = new Subject<FindDivergencesContext>()
  const markName = ['collateDocumentDivergences', cacheKey].join('.')

  const observable: Observable<CollatedDocumentDivergencesState> = context.pipe(
    debounceTime(DEBOUNCE_DURATION),
    tap(() => performance.mark(cacheKey)),
    distinctUntilChanged(isContextEqual),
    switchScan((state, nextContext) => {
      return of(nextContext).pipe(
        delayTask(),
        tap(() => performance.mark(markName)),
        switchMap(readDocumentDivergences),
        toArray(),
        tap(() =>
          performance.measure(cacheKey, {
            start: markName,
            detail: {
              devtools: {
                dataType: 'track-entry',
                track: 'Find all divergences',
                trackGroup: 'Aggregate Divergences',
                color: 'tertiary-dark',
              },
            },
          }),
        ),
        map<DivergenceAtPath[], Record<string, Divergence>>(Object.fromEntries),
        map<Record<string, Divergence>, CollatedDocumentDivergencesState>((divergences) => ({
          ...state,
          state: 'ready',
          divergences,
        })),
        startWith<CollatedDocumentDivergencesState>({
          ...state,
          state: 'pending',
        }),
      )
    }, collateDocumentDivergencesInitialState),
    startWith(collateDocumentDivergencesInitialState),
    shareReplay(1),
  )

  const instance: Instance = {context, observable}

  cache.set(cacheKey, instance)
  cacheWriteChannel.next(cacheKey)

  return instance
}

/**
 * Subscribe to collated document divergences without initiating computation.
 *
 * @internal
 */
export function peekCollatedDocumentDivergences({
  upstreamId,
  subjectId,
}: CollatedDocumentDivergencesContext): Observable<CollatedDocumentDivergencesState> {
  initialiseCache()

  const cacheKey = getCacheKey({upstreamId, subjectId})
  const instance = cache.get(cacheKey)

  if (typeof instance !== 'undefined') {
    return instance.observable
  }

  return cacheWriteChannel.pipe(
    filter((writtenCacheKey) => writtenCacheKey === cacheKey),
    map((writtenCacheKey) => cache.get(writtenCacheKey)),
    filter((cachedInstance) => typeof cachedInstance !== 'undefined'),
    mergeMap(({observable}) => observable),
    startWith(collateDocumentDivergencesInitialState),
    shareReplay(1),
  )
}

function isContextEqual(a: FindDivergencesContext, b: FindDivergencesContext): boolean {
  return (
    a.upstreamHead._rev === b.upstreamHead._rev &&
    a.subjectHead._rev === b.subjectHead._rev &&
    a.upstreamAtFork._rev === b.upstreamAtFork._rev &&
    isEqual(a.resolutions, b.resolutions)
  )
}

function initialiseCache() {
  cache ??= new QuickLRU({maxSize: CACHE_MAX_SIZE})
  cacheWriteChannel ??= new Subject()
}

function getCacheKey({
  subjectId,
  upstreamId,
}: Pick<CollatedDocumentDivergencesContext, 'subjectId' | 'upstreamId'>): string {
  return [upstreamId, subjectId].join('.')
}
