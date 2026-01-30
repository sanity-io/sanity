import {useEffect, useMemo, useRef, useState} from 'react'
import {ReplaySubject} from 'rxjs'
import {map} from 'rxjs/operators'
import {type RouterState, useRouter} from 'sanity/router'

import {LOADING_PANE} from '../constants'
import {
  type DocumentPaneNode,
  type PaneNode,
  type RouterPaneGroup,
  type RouterPanes,
} from '../types'
import {useStructureTool} from '../useStructureTool'
import {createResolvedPaneNodeStream} from './createResolvedPaneNodeStream'

interface PaneData {
  active: boolean
  childItemId: string | null
  groupIndex: number
  index: number
  itemId: string
  key: string
  pane: PaneNode | typeof LOADING_PANE
  params: Record<string, string | undefined> & {perspective?: string}
  path: string
  payload: unknown
  selected: boolean
  siblingIndex: number
  maximized: boolean
}

export interface Panes {
  paneDataItems: PaneData[]
  routerPanes: RouterPanes
  resolvedPanes: (PaneNode | typeof LOADING_PANE)[]
  maximizedPane: PaneData | null
  setMaximizedPane: (pane: PaneData | null) => void
}

function useRouterPanesStream() {
  const [routerStateSubject] = useState(() => new ReplaySubject<RouterState>(1))
  const routerPanes$ = useMemo(
    () =>
      routerStateSubject
        .asObservable()
        .pipe(map((_routerState) => (_routerState?.panes || []) as RouterPanes)),
    [routerStateSubject],
  )
  const {state: routerState} = useRouter()
  useEffect(() => {
    routerStateSubject.next(routerState)
  }, [routerState, routerStateSubject])

  return routerPanes$
}

export function useResolvedPanes(): Panes {
  // used to propagate errors from async effect. throwing inside of the render
  // will bubble the error to react where it can be picked up by standard error
  // boundaries
  const [error, setError] = useState<unknown>()
  const [maximizedPane, setMaximizedPane] = useState<PaneData | null>(null)
  if (error) throw error

  const {structureContext, rootPaneNode} = useStructureTool()
  const {navigate, state: routerState} = useRouter()

  // Get router panes directly from router state (doesn't include implicit root pane)
  // Memoized to avoid unnecessary effect re-runs
  const routerPanesFromState = useMemo(
    () => (routerState?.panes || []) as RouterPanes,
    [routerState?.panes],
  )

  // Track which document IDs we've already expanded to avoid re-expanding
  // when the user manually closes a split pane
  const expandedDocumentIds = useRef<Set<string>>(new Set())

  const [data, setData] = useState<Omit<Panes, 'maximizedPane' | 'setMaximizedPane'>>({
    paneDataItems: [],
    resolvedPanes: [],
    routerPanes: [],
  })

  const routerPanesStream = useRouterPanesStream()

  useEffect(() => {
    const resolvedPanes$ = createResolvedPaneNodeStream({
      rootPaneNode,
      routerPanesStream,
      structureContext,
    }).pipe(
      map((resolvedPanes) => {
        const routerPanes = resolvedPanes.reduce<RouterPanes>((acc, next) => {
          const currentGroup = acc[next.groupIndex] || []
          currentGroup[next.siblingIndex] = next.routerPaneSibling
          acc[next.groupIndex] = currentGroup
          return acc
        }, [])

        const groupsLen = routerPanes.length

        const paneDataItems = resolvedPanes.map((pane) => {
          const {groupIndex, flatIndex, siblingIndex, routerPaneSibling, path} = pane
          const itemId = routerPaneSibling.id
          const nextGroup = routerPanes[groupIndex + 1] as RouterPaneGroup | undefined

          const paneDataItem: PaneData = {
            active: groupIndex === groupsLen - 2,
            childItemId: nextGroup?.[0].id ?? null,
            index: flatIndex,
            itemId: routerPaneSibling.id,
            groupIndex,
            key: `${
              pane.type === 'loading' ? 'unknown' : pane.paneNode.id
            }-${itemId}-${siblingIndex}`,
            pane: pane.type === 'loading' ? LOADING_PANE : pane.paneNode,
            params: routerPaneSibling.params || {},
            path: path.join(';'),
            payload: routerPaneSibling.payload,
            selected: flatIndex === resolvedPanes.length - 1,
            siblingIndex,
            maximized: false,
          }

          return paneDataItem
        })

        return {
          paneDataItems,
          routerPanes,
          resolvedPanes: paneDataItems.map((pane) => pane.pane),
        }
      }),
    )

    const subscription = resolvedPanes$.subscribe({
      next: (result) => setData(result),
      error: (e) => setError(e),
    })

    return () => subscription.unsubscribe()
  }, [rootPaneNode, routerPanesStream, structureContext])

  // Auto-expand panes based on defaultPanes configuration
  // This handles the case where a user clicks directly on a list item (not via intent)
  useEffect(() => {
    const {paneDataItems} = data

    // Find the last pane that is a document with defaultPanes
    const lastPaneData = paneDataItems[paneDataItems.length - 1]
    if (!lastPaneData) return

    const lastPane = lastPaneData.pane
    if (lastPane === LOADING_PANE) return
    if (lastPane.type !== 'document') return

    // We've confirmed lastPane.type === 'document', so we can safely cast
    const documentPane = lastPane as unknown as DocumentPaneNode
    const {defaultPanes} = documentPane

    // Check if defaultPanes is configured with 2+ views
    if (!defaultPanes || defaultPanes.length < 2) return

    // Convert from resolved pane groupIndex (includes root) to router pane index (no root)
    // groupIndex 0 = root, groupIndex 1 = routerPanesFromState[0], etc.
    const routerPaneIndex = lastPaneData.groupIndex - 1
    const currentGroup = routerPanesFromState[routerPaneIndex]

    // Only expand if currently single sibling (not already split)
    if (!currentGroup || currentGroup.length !== 1) return

    // Check if user already has a view param - they may have manually navigated
    const currentParams = currentGroup[0].params
    if (currentParams?.view) return

    // Check if we've already expanded this document (user may have closed split pane)
    const documentId = documentPane.options.id
    if (expandedDocumentIds.current.has(documentId)) return

    // Mark this document as expanded
    expandedDocumentIds.current.add(documentId)

    // Create expanded group with split panes (similar to duplicateCurrent + setView)
    const expandedGroup: RouterPaneGroup = defaultPanes.map((viewId) => ({
      id: currentGroup[0].id,
      params: {...currentParams, view: viewId},
      payload: currentGroup[0].payload,
    }))

    // Navigate to expanded state (replace to avoid polluting history)
    // Replace the last pane group with the expanded version
    navigate({panes: [...routerPanesFromState.slice(0, -1), expandedGroup]}, {replace: true})
  }, [data, navigate, routerPanesFromState])

  const paneDataItemsWithMaximized = useMemo(() => {
    return data.paneDataItems.map((item) => ({
      ...item,
      maximized: maximizedPane ? item.key === maximizedPane.key : false,
    }))
  }, [data.paneDataItems, maximizedPane])

  return {
    ...data,
    paneDataItems: paneDataItemsWithMaximized,
    maximizedPane,
    setMaximizedPane,
  }
}
