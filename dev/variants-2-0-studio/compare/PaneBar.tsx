import {useSyncExternalStore} from 'react'

import {buildConditionFacets} from '../../../packages/sanity/src/core/variants/tool/util'
import {useVariantDefinitions} from '../c1/world'
import {useVersionList} from '../data/useVersionList'
import {usePaneAddress} from '../pane/PaneAddress'
import {ComposedCompareBar} from './composed/ComposedCompareBar'
import {addressOfSide, type BundleOption, sideOfAddress} from './composed/composedModel'

// Compare E: a pane-scope bar above each pane (E9 3b L4 434:2999): the pane's own address, no row label, not clearable, not comparable (the
// comparison lives in the header). The collapse rung is shared by every pane bar, so the dimensions line up across panes.

let rung = 0
const listeners = new Set<() => void>()
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => void listeners.delete(l)
}
const setRung = (next: number) => {
  rung = next
  listeners.forEach((l) => l())
}

export function PaneBar({documentId}: {documentId: string}) {
  const {local, set} = usePaneAddress()
  const definitions = useVariantDefinitions()
  const versions = useVersionList(documentId)
  const shared = useSyncExternalStore(subscribe, () => rung)
  const releases: BundleOption[] = (versions ?? [])
    .filter((v) => v.release && v.bundleId && !v.variantId)
    .map((v) => ({id: v.bundleId as string, label: v.release as string}))
  const bundles: BundleOption[] = [
    {id: 'drafts', label: 'Draft'},
    {id: 'published', label: 'Published'},
    ...releases,
  ]
  return (
    <div data-testid="pane-bar" style={{padding: '6px 12px'}}>
      <ComposedCompareBar
        anchor={sideOfAddress(local, definitions)}
        bundles={bundles}
        clearable={false}
        comparable={false}
        counterpart={undefined}
        facets={buildConditionFacets(definitions as never)}
        instanceId={`pane-${documentId}`}
        layout="inline"
        maxCompared={1}
        onAnchorChange={(side) => {
          const next = addressOfSide(side, definitions)
          set({perspective: next.perspective, variant: next.variant ?? 'none'})
        }}
        onCounterpartChange={() => undefined}
        onRung={setRung}
        rowLabel={false}
        rung={shared}
        variants={definitions}
      />
    </div>
  )
}
