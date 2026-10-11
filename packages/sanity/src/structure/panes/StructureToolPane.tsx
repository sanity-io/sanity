import {dequal as isEqual} from 'dequal/lite'
import {lazy, memo, Suspense} from 'react'

import {PaneRouterProvider} from '../components/paneRouter/PaneRouterProvider'
import {type PaneNode} from '../types'
import {LoadingPane} from './loading'
import {UnknownPane} from './unknown/UnknownPaneType'

interface StructureToolPaneProps {
  active: boolean
  childItemId: string | null
  groupIndex: number
  index: number
  itemId: string
  pane: PaneNode
  paneKey: string
  params: Record<string, string | undefined> & {perspective?: string}
  payload: unknown
  path: string
  selected: boolean
  siblingIndex: number
  maximized: boolean
  onSetMaximizedPane?: () => void
}

// Audited in the production build of dev/test-studio: `list` (3.2 KB gzip) and `component`
// (1.5 KB gzip) are real chunks. `document` and `documentList` resolve to 0.1 KB re-export shims,
// because `sanity/structure` exports `DocumentPane` and `DocumentListPane` and the entry imports
// their chunks statically anyway, so those two lazies only add a request and a `LoadingPane` flash
// on the first mount of each pane type. Kept lazy for now; dropping them is a separate change.
const UserComponentPane = lazy(() => import('./userComponent'))
const DocumentPane = lazy(() => import('./document/pane'))
const DocumentListPane = lazy(() => import('./documentList/pane'))
const ListPane = lazy(() => import('./list'))

const paneMap = {
  component: UserComponentPane,
  document: DocumentPane,
  documentList: DocumentListPane,
  list: ListPane,
}

/**
 * NOTE: The same pane might appear multiple times (split pane), so use index as tiebreaker
 *
 * @internal
 */
export const StructureToolPane = memo(
  function StructureToolPane(props: StructureToolPaneProps) {
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
      maximized,
      onSetMaximizedPane,
    } = props

    const PaneComponent = paneMap[pane.type] || UnknownPane

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
            maximized={maximized}
            onSetMaximizedPane={onSetMaximizedPane}
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

    const keys = new Set([...Object.keys(prev), ...Object.keys(next)]) as Set<keyof typeof next>

    // then shallow equal the rest
    for (const key of keys) {
      if (prev[key] !== next[key]) return false
    }

    return true
  },
)
