import React, {memo, lazy, Suspense} from 'react'
import {isEqual} from 'lodash'
import {PaneNode} from '../types'
import {PaneRouterProvider} from '../components/paneRouter'
import {UnknownPane} from './unknown'
import {LoadingPane} from './loading'

interface DeskToolPaneProps {
  active: boolean
  childItemId: string | null
  groupIndex: number
  index: number
  itemId: string
  pane: PaneNode
  paneKey: string
  params: Record<string, string | undefined>
  payload: unknown
  path: string
  selected: boolean
  siblingIndex: number
}

// TODO: audit this creates separate chunks
const paneMap = {
  component: lazy(() => import('./userComponent')),
  document: lazy(() => import('./document/pane')),
  documentList: lazy(() => import('./documentList/pane')),
  list: lazy(() => import('./list')),
}

/**
 * NOTE: The same pane might appear multiple times (split pane), so use index as tiebreaker
 *
 * @internal
 */
export const DeskToolPane = memo(
  function DeskToolPane(props: DeskToolPaneProps) {
    const {
      active,
      childItemId,
      groupIndex,
      index,
      itemId,
      pane,
      paneKey,
      params,
      payload,
      path,
      selected,
      siblingIndex,
    } = props

    const PaneComponent = paneMap[pane.type] || UnknownPane
    console.log('hello7')
    return (
      <PaneRouterProvider
        flatIndex={index}
        index={groupIndex}
        params={params}
        payload={payload}
        siblingIndex={siblingIndex}
      >
        <Suspense fallback={<LoadingPane paneKey={paneKey} path={path} selected={selected} />}>
          <PaneComponent
            childItemId={childItemId || ''}
            index={index}
            itemId={itemId}
            isActive={active}
            isSelected={selected}
            paneKey={paneKey}
            // @ts-expect-error TS doesn't know how to handle this intersection
            pane={pane}
          />
        </Suspense>
      </PaneRouterProvider>
    )
  },
  (
    {params: prevParams = {}, payload: prevPayload = null, ...prev},
    {params: nextParams = {}, payload: nextPayload = null, ...next},
  ) => {
    // deeply compare these objects (it's okay, they're small)
    if (!isEqual(prevParams, nextParams)) return false
    if (!isEqual(prevPayload, nextPayload)) return false

    const keys = new Set([...Object.keys(prev), ...Object.keys(next)]) as Set<
      keyof typeof next | keyof typeof prev
    >

    // then shallow equal the rest
    for (const key of keys) {
      if (prev[key] !== next[key]) return false
    }

    return true
  },
)
