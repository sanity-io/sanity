import {useEffect, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {BehaviorSubject, combineLatest, type Observable, of} from 'rxjs'
import {catchError, distinctUntilChanged, map, scan, switchMap} from 'rxjs/operators'
import {
  type DocumentPreviewStore,
  type PerspectiveStack,
  useDocumentPreviewStore,
  usePerspective,
} from 'sanity'

import {type ListItemCount} from '../../structureBuilder/ListItem'
import {type PaneListItem, type PaneListItemDivider} from '../../types'

const COUNTS_TAG = 'structure.list-pane-counts'

type ListPaneCounts = Record<string, number>

const EMPTY_COUNTS: ListPaneCounts = {}

interface CountDescriptor {
  id: string
  count: ListItemCount
}

interface CountsInput {
  active: boolean
  descriptors: CountDescriptor[]
  perspectiveStack: PerspectiveStack
  identityKey: string
}

function isCountableItem(
  item: PaneListItem | PaneListItemDivider,
): item is PaneListItem & {count: ListItemCount} {
  return item.type === 'listItem' && item.count !== undefined
}

function getTabVisible(): boolean {
  return typeof document === 'undefined' || document.visibilityState === 'visible'
}

/**
 * Subscribes to the shared core count observer once per descriptor and merges the emissions into
 * a single `Record<itemId, number>`. `combineLatest` holds until every descriptor has emitted, so
 * nothing renders before the first resolve; a resolved `0` is kept as `0`. Identical descriptors
 * across panes are deduplicated inside the core observer, so each distinct filter rides one query
 * slice regardless of how many panes request it.
 */
function observePaneCounts(
  documentPreviewStore: DocumentPreviewStore,
  descriptors: CountDescriptor[],
  perspectiveStack: PerspectiveStack,
): Observable<ListPaneCounts> {
  return combineLatest(
    descriptors.map((descriptor) =>
      documentPreviewStore
        .unstable_observeDocumentCount(
          descriptor.count.filter,
          descriptor.count.params,
          perspectiveStack,
          {tag: COUNTS_TAG},
        )
        .pipe(map((count) => [descriptor.id, count] as const)),
    ),
  ).pipe(map((entries) => Object.fromEntries(entries)))
}

/**
 * A single long-lived pipe fed by an input subject: when the identity key changes (descriptor set,
 * perspective, or active state), the current subscriptions are closed and new ones start inside the
 * same stream (`switchMap`), so there is never more than one active set of subscriptions. While
 * inactive (tab hidden or pane off-screen) it emits an empty result, which the `scan` merges over
 * the previous counts - so the count subscriptions drop (their slice leaves the shared batch) while
 * existing badges stay put.
 */
function getListPaneCounts(
  documentPreviewStore: DocumentPreviewStore,
  input$: Observable<CountsInput>,
): Observable<ListPaneCounts> {
  return input$.pipe(
    distinctUntilChanged((previous, next) => previous.identityKey === next.identityKey),
    switchMap((input) =>
      input.active
        ? observePaneCounts(documentPreviewStore, input.descriptors, input.perspectiveStack).pipe(
            // catchError stays on this inner stream so the outer pipe keeps reacting to
            // descriptor-set and perspective changes after a failed fetch.
            catchError(() => of<ListPaneCounts>(EMPTY_COUNTS)),
          )
        : of<ListPaneCounts>(EMPTY_COUNTS),
    ),
    scan((previous, next) => ({...previous, ...next}), EMPTY_COUNTS),
  )
}

/**
 * Keeps a live document count for every list item carrying a `count` descriptor by subscribing to
 * the shared core count observer, which batches every count requested studio-wide into one combined
 * query driven by the shared global listener.
 *
 * The subscriptions are dropped while the pane is off-screen (`enabled` is `false`) or the browser
 * tab is hidden, so a backgrounded studio holds no count in the batch. Counts already resolved stay
 * visible while paused, and a fresh fetch runs when the pane becomes active again.
 *
 * @internal
 */
export function useListPaneCounts(
  items: (PaneListItem | PaneListItemDivider)[],
  enabled = true,
): ListPaneCounts {
  const documentPreviewStore = useDocumentPreviewStore()
  const {perspectiveStack} = usePerspective()

  // Defer the initial fetch off first paint (product decision): the list must paint
  // immediately, badges fill in afterwards.
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const [tabVisible, setTabVisible] = useState(getTabVisible)
  useEffect(() => {
    const handleVisibilityChange = () => setTabVisible(getTabVisible())
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const descriptors = items
    .filter(isCountableItem)
    .map((item) => ({id: item.id, count: item.count}))

  const active = ready && enabled && tabVisible && descriptors.length > 0

  const perspectiveKey = perspectiveStack.join(',')
  const identityKey = [
    active,
    perspectiveKey,
    ...descriptors
      .map((descriptor) => `${descriptor.id}:${JSON.stringify(descriptor.count)}`)
      .toSorted(),
  ].join('|')

  const input$ = useMemo(
    () =>
      new BehaviorSubject<CountsInput>({
        active: false,
        descriptors: [],
        perspectiveStack: [],
        identityKey: '',
      }),
    [],
  )
  useEffect(() => {
    input$.next({active, descriptors, perspectiveStack, identityKey})
  }, [input$, active, descriptors, perspectiveStack, identityKey])

  const counts$ = useMemo(
    () => getListPaneCounts(documentPreviewStore, input$),
    [documentPreviewStore, input$],
  )

  return useObservable(counts$, EMPTY_COUNTS)
}
