import {Text} from '@sanity/ui'
import {useState, useSyncExternalStore} from 'react'

import {buildConditionFacets} from '../../../packages/sanity/src/core/variants/tool/util'
import {useVariantDefinitions} from '../c1/world'
import {useVersionList} from '../data/useVersionList'
import {layerLabel, usePaneAddress} from '../pane/PaneAddress'
import {type Address, isOneMove, NONE, sameAddress, setAgainstPath} from './address'
import {BaseNote} from './BaseNote'
import {ComposedCompareBar} from './composed/ComposedCompareBar'
import {addressOfSide, type BundleOption, sideOfAddress} from './composed/composedModel'
import {useCompareActions, useComparison} from './useCompare'

// Compare E: a pane-scope bar above each pane (E9 3b L4 434:2999): the pane's own address, no row label, not clearable. The global bar stays one row
// (Showing only), so the Against side lives HERE: the Against pane's bar carries the ⇄ marker, names the base ("Comparing
// against: X", with the way back to Published) and refuses a second dimension. The collapse rung is shared by every pane bar, so the dimensions line up.

/** The height of the base note line (with its "Back to Published" button), reserved in both pane bars. */
const NOTE_LINE = 36

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
  const {held, local, set} = usePaneAddress()
  const definitions = useVariantDefinitions()
  const versions = useVersionList(documentId)
  const shared = useSyncExternalStore(subscribe, () => rung)
  const comparison = useComparison()
  const actions = useCompareActions()
  const [refusal, setRefusal] = useState<string | null>(null)
  const releases: BundleOption[] = (versions ?? [])
    .filter((v) => v.release && v.bundleId && !v.variantId)
    .map((v) => ({id: v.bundleId as string, label: v.release as string}))
  const bundles: BundleOption[] = [
    {id: 'drafts', label: 'Draft'},
    {id: 'published', label: 'Published'},
    ...releases,
  ]
  // The Against pane is the one that holds the comparison's Against address.
  const against = Boolean(
    held && comparison && comparison.docId === documentId && sameAddress(local, comparison.against),
  )
  const titleOf = (id: string) =>
    id === NONE
      ? 'Base'
      : (definitions.find((d) => d._id.replace(/^_\.variants\./, '') === id)?.metadata?.title ?? id)
  const label = (a: Address) => `${layerLabel(a.perspective)} · ${titleOf(a.variant)}`
  return (
    <div
      data-testid="pane-bar"
      data-side={against ? 'against' : 'showing'}
      style={{padding: '6px 12px'}}
    >
      <div style={{alignItems: 'center', display: 'flex', gap: 8}}>
        {/* The ported bar draws one end per row once it compares, so the ⇄ is this marker: the pane that is compared with Showing. */}
        {against ? (
          <span
            aria-label="Compared with the Showing pane"
            data-testid="pane-bar-compared"
            role="img"
            style={{flex: 'none', fontSize: 14, fontWeight: 600}}
            title="Compared with the Showing pane"
          >
            ⇄
          </span>
        ) : null}
        <div style={{flex: '1 1 0%', minWidth: 0}}>
          <ComposedCompareBar
            anchor={sideOfAddress(local, definitions)}
            bundles={bundles}
            clearable={false}
            comparable={against}
            counterpart={
              against && comparison ? sideOfAddress(comparison.showing, definitions) : undefined
            }
            facets={buildConditionFacets(definitions as never)}
            instanceId={`pane-${documentId}`}
            layout="inline"
            maxCompared={1}
            onAnchorChange={(side) => {
              const next = addressOfSide(side, definitions)
              const address = {perspective: next.perspective, variant: next.variant ?? NONE}
              if (against && comparison && !isOneMove(comparison.showing, address)) {
                setRefusal('Open beta compares one dimension at a time.')
                return
              }
              setRefusal(null)
              set(address)
            }}
            // The Showing side is the global perspective: it is changed in the global bar, not from this pane.
            onCounterpartChange={() => undefined}
            onRefuse={setRefusal}
            onRung={setRung}
            rowLabel={false}
            rung={shared}
            variants={definitions}
          />
        </div>
      </div>
      {/* Both bars reserve the note line, so the two panes' forms start at the same height. */}
      <div
        aria-hidden={!against}
        data-testid="pane-bar-note"
        style={{minHeight: NOTE_LINE, paddingTop: 4}}
      >
        {against && comparison ? (
          <>
            {refusal ? (
              <Text data-testid="pane-bar-refusal" size={1}>
                {refusal}
              </Text>
            ) : null}
            <BaseNote
              base={comparison.against}
              label={label}
              onReset={(to) => actions.go(setAgainstPath(comparison, to))}
              showing={comparison.showing}
            />
          </>
        ) : null}
      </div>
    </div>
  )
}
