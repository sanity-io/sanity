import {useEffect, useMemo, useState} from 'react'
import {ReplaySubject} from 'rxjs'
import {map} from 'rxjs/operators'
import {type RouterState, useRouter} from 'sanity/router'

import {LOADING_PANE} from '../constants'
import {type PaneNode, type RouterPaneGroup, type RouterPanes} from '../types'
import {useStructureTool} from '../useStructureTool'
import {isDocumentPaneNode} from '../utils'
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
type ResolvedPanesData = Omit<Panes, 'maximizedPane' | 'setMaximizedPane'>

export function useResolvedPanes(): Panes {
  // used to propagate errors from async effect. throwing inside of the render
  // will bubble the error to react where it can be picked up by standard error
  // boundaries
  const [error, setError] = useState<unknown>()
  const [maximizedPane, setMaximizedPane] = useState<PaneData | null>(null)
  if (error) throw error

  const {structureContext, rootPaneNode} = useStructureTool()
  const {navigate} = useRouter()

  const [data, setData] = useState<ResolvedPanesData>({
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

  useEffect(
    function maybeOpenDefaultPanes() {
      const {paneDataItems, routerPanes} = data

      // Find the last pane that is a document with defaultPanes
      const lastPaneData = paneDataItems[paneDataItems.length - 1]
      const lastPane = lastPaneData?.pane
      if (!lastPane || !isDocumentPaneNode(lastPane)) return

      // Check if defaultPanes is configured
      if (!lastPane.defaultPanes) return

      const currentGroup = routerPanes[paneDataItems.length - 1]
      // Only expand if currently single sibling (not already split)
      if (!currentGroup || currentGroup.length !== 1) return

      const currentParams = currentGroup[0].params
      if (currentParams?.expanded) return

      // Create expanded group with split panes (similar to duplicateCurrent + setView)
      const expandedGroup: RouterPaneGroup = lastPane.defaultPanes.map((viewId, index) => ({
        id: currentGroup[0].id,
        params: {
          ...currentParams,
          view: viewId,
          // Adds expanded to the first pane in the group to avoid re-expanding the group with every pane change
          ...(index === 0 ? {expanded: 'true'} : {}),
        },
        payload: currentGroup[0].payload,
      }))
      // Navigate to expanded state (replace to avoid polluting history)
      navigate({panes: [...routerPanes.slice(1, -1), expandedGroup]}, {replace: true})
    },
    [data, navigate],
  )

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
