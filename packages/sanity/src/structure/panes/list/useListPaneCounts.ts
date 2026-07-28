import {type SanityClient} from '@sanity/client'
import {useEffect, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {BehaviorSubject, type Observable, of} from 'rxjs'
import {catchError, distinctUntilChanged, map, scan, switchMap} from 'rxjs/operators'
import {
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  listenQuery,
  type PerspectiveStack,
  useClient,
  usePerspective,
} from 'sanity'

import {type ListItemCount} from '../../structureBuilder/ListItem'
import {type PaneListItem, type PaneListItemDivider} from '../../types'
import {buildListPaneCountsQuery, type ListPaneCountsQuery} from './listPaneCountsQuery'

type ListPaneCounts = Record<string, number>

const EMPTY_COUNTS: ListPaneCounts = {}

interface CountsInput {
  active: boolean
  query: ListPaneCountsQuery | null
  perspectiveStack: PerspectiveStack
  identityKey: string
}

function isCountableItem(
  item: PaneListItem | PaneListItemDivider,
): item is PaneListItem & {count: ListItemCount} {
  return item.type === 'listItem' && item.count !== undefined
}

function listenListPaneCounts(
  client: SanityClient,
  query: ListPaneCountsQuery,
  perspectiveStack: PerspectiveStack,
): Observable<ListPaneCounts> {
  return listenQuery(client, {fetch: query.fetch, listen: query.listen}, query.params, {
    tag: 'structure.list-pane-counts',
    perspective: perspectiveStack,
    throttleTime: 1000,
  }).pipe(
    map((response: ListPaneCounts) => response ?? EMPTY_COUNTS),
    // catchError stays on this inner stream so the outer pipe keeps reacting to
    // item-set and perspective changes after a failed fetch.
    catchError(() => of<ListPaneCounts>(EMPTY_COUNTS)),
  )
}

function getTabVisible(): boolean {
  return typeof document === 'undefined' || document.visibilityState === 'visible'
}

/**
 * A single long-lived pipe fed by an input subject: when the identity key changes (item set,
 * perspective, or active state), the current listener is closed and a new fetch + listener
 * starts inside the same stream (`switchMap`), so there is never more than one active listener.
 * While inactive (tab hidden or pane off-screen) it emits an empty result, which the `scan`
 * merges over the previous counts - so the listener tears down while existing badges stay put.
 */
function getListPaneCounts(
  client: SanityClient,
  input$: Observable<CountsInput>,
): Observable<ListPaneCounts> {
  return input$.pipe(
    distinctUntilChanged((previous, next) => previous.identityKey === next.identityKey),
    switchMap((input) =>
      input.active && input.query
        ? listenListPaneCounts(client, input.query, input.perspectiveStack)
        : of<ListPaneCounts>(EMPTY_COUNTS),
    ),
    scan((previous, next) => ({...previous, ...next}), EMPTY_COUNTS),
  )
}

/**
 * Keeps a live document count for every list item carrying a `count` descriptor, using a
 * single throttled listener over one batched aggregate count query.
 *
 * The listener is paused while the pane is off-screen (`enabled` is `false`) or the browser
 * tab is hidden, so a backgrounded studio holds no live query. Counts already resolved stay
 * visible while paused, and a fresh fetch runs when the pane becomes active again.
 *
 * @internal
 */
export function useListPaneCounts(
  items: (PaneListItem | PaneListItemDivider)[],
  enabled = true,
): ListPaneCounts {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
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
  const query = descriptors.length > 0 ? buildListPaneCountsQuery(descriptors) : null

  const active = ready && enabled && tabVisible && query !== null

  const perspectiveKey = perspectiveStack.join(',')
  const identityKey = [
    active,
    perspectiveKey,
    ...descriptors.map((descriptor) => descriptor.id).toSorted(),
    query ? JSON.stringify(query) : '',
  ].join('|')

  const input$ = useMemo(
    () =>
      new BehaviorSubject<CountsInput>({
        active: false,
        query: null,
        perspectiveStack: [],
        identityKey: '',
      }),
    [],
  )
  useEffect(() => {
    input$.next({active, query, perspectiveStack, identityKey})
  }, [input$, active, query, perspectiveStack, identityKey])

  const counts$ = useMemo(() => getListPaneCounts(client, input$), [client, input$])

  return useObservable(counts$, EMPTY_COUNTS)
}
