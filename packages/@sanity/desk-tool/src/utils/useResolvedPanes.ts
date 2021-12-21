import {RouterState, useRouter} from '@sanity/base/router'
import {DocumentBuilder} from '@sanity/structure'
import {useEffect, useState, useMemo} from 'react'
import {Subject} from 'rxjs'
import {map} from 'rxjs/operators'
import {LOADING_PANE} from '../constants'
import {RouterPanes, PaneNode, RouterPaneGroup, UnresolvedPaneNode} from '../types'
import {createResolvedPaneNodeStream} from './createResolvedPaneNodeStream'
// import {loadStructure} from './loadStructure'

interface PaneData {
  active: boolean
  childItemId: string | null
  groupIndex: number
  index: number
  itemId: string
  key: string
  pane: PaneNode | typeof LOADING_PANE
  params: Record<string, string | undefined>
  path: string
  payload: unknown
  selected: boolean
  siblingIndex: number
}

interface Panes {
  paneDataItems: PaneData[]
  routerPanes: RouterPanes
  resolvedPanes: (PaneNode | typeof LOADING_PANE)[]
}

export function useResolvedPanes(
  structure: UnresolvedPaneNode,
  resolveDocumentNode: (options: {documentId?: string; schemaType: string}) => DocumentBuilder
): Panes {
  const router = useRouter()
  const [data, setData] = useState<Panes>({
    paneDataItems: [],
    resolvedPanes: [],
    routerPanes: [],
  })

  // used to propagate errors from async effect. throwing inside of the render
  // will bubble the error to react where it can be picked up by standard error
  // boundaries
  const [error, setError] = useState<unknown>()
  if (error) throw error

  const routerStateSubject = useMemo(() => new Subject<RouterState>(), [])
  const routerState$ = useMemo(() => routerStateSubject.asObservable(), [routerStateSubject])
  const routerPanes$ = useMemo(
    () => routerState$.pipe(map((routerState) => (routerState?.panes || []) as RouterPanes)),
    [routerState$]
  )

  useEffect(() => {
    const resolvedPanes$ = createResolvedPaneNodeStream(resolveDocumentNode, {
      rootPaneNode: structure,
      routerPanesStream: routerPanes$,
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
          }

          return paneDataItem
        })

        return {
          paneDataItems,
          routerPanes,
          resolvedPanes: paneDataItems.map((pane) => pane.pane),
        }
      })
    )

    const subscription = resolvedPanes$.subscribe({
      next: (result) => setData(result),
      error: (e) => setError(e),
    })

    return () => subscription.unsubscribe()
  }, [router, routerPanes$, structure])

  useEffect(() => routerStateSubject.next(router.state), [routerStateSubject, router.state])

  return data
}
