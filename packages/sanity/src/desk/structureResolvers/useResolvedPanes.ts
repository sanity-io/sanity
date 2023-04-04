import {useCallback, useEffect, useMemo, useState} from 'react'
import {ReplaySubject} from 'rxjs'
import {map} from 'rxjs/operators'

import {RouterPanes, PaneNode, RouterPaneGroup} from '../types'
import {useDeskTool} from '../useDeskTool'
import {
  createResolvedPaneNodeStream,
  FlattenedRouterPane,
  ResolvedPaneMeta,
} from './createResolvedPaneNodeStream'
import {RouterState, useRouter, useRouterState} from 'sanity/router'

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

export function useResolvedPanesOld(): PaneData[] {
  const resolvedPanes = useResolvedPaneNodes()

  // used to propagate errors from async effect. throwing inside of the render
  // will bubble the error to react where it can be picked up by standard error
  // boundaries
  const [error, setError] = useState<unknown>()
  if (error) throw error

  console.log({resolvedPanes})
  return useMemo<Panes>(() => {
    console.count('hello')
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
        key: `${pane.type === 'loading' ? 'unknown' : pane.paneNode.id}-${itemId}-${siblingIndex}`,
        pane: pane.type === 'loading' ? LOADING_PANE : pane.paneNode,
        params: routerPaneSibling.params || {},
        path: path.join(';'),
        payload: routerPaneSibling.payload,
        selected: flatIndex === resolvedPanes.length - 1,
        siblingIndex,
      }

      return paneDataItem
    })

    return paneDataItems
  }, [resolvedPanes])
}

export function useResolvedPanes(): FlattenedRouterPane[] {
  const rawRouterPanes = useRouterState(
    useCallback((routerState) => (routerState?.panes || []) as RouterPanes, [])
  )
  console.log({rawRouterPanes})

  // add in implicit "root" router pane
  const routerPanes = useMemo(() => [[{id: 'root'}], ...rawRouterPanes], [rawRouterPanes])
  // create flattened router panes
  return useMemo(() => {
    const flattenedRouterPanes: FlattenedRouterPane[] = routerPanes
      .flatMap((routerPaneGroup, groupIndex) =>
        routerPaneGroup.map((routerPaneSibling, siblingIndex) => ({
          routerPaneSibling,
          groupIndex,
          siblingIndex,
        }))
      )
      // add in the flat index
      .map((i, index) => ({...i, flatIndex: index}))

    return flattenedRouterPanes
  }, [routerPanes])
}
