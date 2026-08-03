import {type ReleaseDocument} from '@sanity/client'
import {act, render} from '@testing-library/react'
import {useMemo} from 'react'
import {useObservable, useSyncObservable} from 'react-rx'
import {BehaviorSubject} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {activeASAPRelease} from '../../releases/__fixtures__/release.fixture'
import {sortReleases} from '../../releases/hooks/utils'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {useAllReleases} from '../../releases/store/useAllReleases'
import {useReleasesStore} from '../../releases/store/useReleasesStore'
import {ARCHIVED_RELEASE_STATES} from '../../releases/util/const'
import {variantAlphaAudience} from '../../variants/__fixtures__/variants.fixture'
import {type VariantStoreState} from '../../variants/store/reducer'
import {useVariantsStore} from '../../variants/store/useVariantsStore'
import {getSelectedReleaseId} from '../getSelectedReleaseId'
import {getSelectedVariant} from '../getSelectedVariant'
import {PerspectiveProvider} from '../PerspectiveProvider'
import {type ReleaseId} from '../types'
import {usePerspective} from '../usePerspective'

/**
 * Executable answer to the review follow-up on this PR:
 *
 * > "I'm not sure about the `useAllReleases`, `useActiveReleases` and
 * > `useAllVariants` hooks.. we can defer those, but it's ok to keep them
 * > sync now. We can have a follow up to verify that"
 *
 * Verdict, as proof: it is NOT safe to defer them — not even through
 * react-rx v5's identity-coherent deferred `useObservable`. Their store
 * observables have a stable identity for the lifetime of the workspace, so
 * the identity fallback never engages; deferral simply makes the
 * list lag one render behind urgent updates. The lists are paired with LIVE
 * selection state (the router-driven perspective / variant params feeding
 * `PerspectiveProvider`) and with each other, so that one-render lag is a
 * tear with real consequences:
 *
 * - `selectedReleaseId` resolves `undefined` under a just-selected release
 *   name (callers like reference create-in-place treat that as "no release").
 * - `selectedVariant` resolves `undefined` under a just-selected variant name
 *   (target-document scoping would bind to the wrong variant).
 * - a deferred `useAllReleases` disagrees with the synchronous
 *   `useActiveReleases` about the same store snapshot, producing the
 *   impossible state "active release missing from all releases".
 *
 * Each deferred counterfactual below is the exact hook body with only the
 * read made deferred, so these tests double as regression proofs: if the
 * hooks are ever deferred, the paired sync tests here spell out precisely
 * which coherent frames consumers rely on.
 *
 * The selection values are read synchronously from their own subjects (like
 * the live router state they model), so a single `act` batches "the store
 * learned about the release/variant" and "the user selected it" into one
 * update — the create-then-navigate flow.
 */

interface MockReleasesState {
  releases: Map<string, ReleaseDocument>
  error?: Error
  state: 'initialising' | 'loading' | 'loaded' | 'error'
}

const releasesState$ = new BehaviorSubject<MockReleasesState>({
  releases: new Map(),
  state: 'initialising',
})
const variantsState$ = new BehaviorSubject<VariantStoreState>({
  variants: new Map(),
  state: 'initialising',
})

// Live selection state, standing in for the router-driven perspective /
// variant params. Read synchronously, never deferred — like the real thing.
const selectedReleaseName$ = new BehaviorSubject<ReleaseId | undefined>(undefined)
const selectedVariantName$ = new BehaviorSubject<string | undefined>(undefined)

vi.mock('../../releases/store/useReleasesStore', () => ({
  useReleasesStore: () => ({state$: releasesState$, dispatch: vi.fn()}),
}))
vi.mock('../../variants/store/useVariantsStore', () => ({
  useVariantsStore: () => ({state$: variantsState$, dispatch: vi.fn()}),
}))

const RELEASE_NAME = 'rASAP' as ReleaseId
const VARIANT_NAME = 'alpha-audience'

const releasesLoaded: MockReleasesState = {
  releases: new Map([[activeASAPRelease._id, activeASAPRelease]]),
  state: 'loaded',
}
const variantsLoaded: VariantStoreState = {
  variants: new Map([[variantAlphaAudience._id, variantAlphaAudience]]),
  state: 'loaded',
}

// Per-render frames recorded by the probes below. Assertions use
// contains/not-contains (not exact sequences) so they stay robust to extra
// renders.
const releaseFrames: {name: string | undefined; releaseId: string | undefined}[] = []
const variantFrames: {name: string | undefined; variantId: string | undefined}[] = []
const crossFrames: {active: string[]; all: string[]}[] = []

function ReleaseIdProbe() {
  const {selectedPerspectiveName, selectedReleaseId} = usePerspective()
  releaseFrames.push({name: selectedPerspectiveName, releaseId: selectedReleaseId})
  return null
}

/** The real provider fed by the live selection, as wired in the studio. */
function SyncReleaseHarness() {
  const name = useSyncObservable(selectedReleaseName$)
  return (
    <PerspectiveProvider selectedPerspectiveName={name} excludedPerspectives={[]}>
      <ReleaseIdProbe />
    </PerspectiveProvider>
  )
}

function VariantProbe() {
  const {selectedVariantName, selectedVariant} = usePerspective()
  variantFrames.push({name: selectedVariantName, variantId: selectedVariant?._id})
  return null
}

function SyncVariantHarness() {
  const name = useSyncObservable(selectedVariantName$)
  return (
    <PerspectiveProvider
      selectedPerspectiveName={undefined}
      selectedVariantName={name}
      excludedPerspectives={[]}
    >
      <VariantProbe />
    </PerspectiveProvider>
  )
}

/**
 * `useActiveReleases` body with only the read deferred — what the hook would
 * become if it adopted the deferred `useObservable` — paired with the same
 * live selection and `getSelectedReleaseId` derivation the provider uses.
 */
function DeferredActiveReleasesCounterfactual() {
  const name = useSyncObservable(selectedReleaseName$)
  const {state$} = useReleasesStore()
  const state = useObservable(state$)!
  const data = useMemo(
    () =>
      sortReleases(
        Array.from(state.releases.values()).filter(
          (release) => !ARCHIVED_RELEASE_STATES.includes(release.state),
        ),
      ).reverse(),
    [state.releases],
  )
  releaseFrames.push({name, releaseId: getSelectedReleaseId(name, data)})
  return null
}

/**
 * `useAllVariants` body with only the read deferred, paired with the same
 * `getSelectedVariant` derivation `PerspectiveProvider` uses.
 */
function DeferredAllVariantsCounterfactual() {
  const name = useSyncObservable(selectedVariantName$)
  const {state$} = useVariantsStore()
  const {variants} = useObservable(state$)!
  variantFrames.push({
    name,
    variantId: getSelectedVariant({selectedVariantName: name, variantsById: variants})?._id,
  })
  return null
}

/**
 * The real synchronous `useActiveReleases` next to what `useAllReleases`
 * would return if deferred. Both read the same store observable.
 */
function MixedSyncDeferredReleasesProbe() {
  const {data: active} = useActiveReleases()
  const {state$} = useReleasesStore()
  const deferredState = useObservable(state$)!
  const all = useMemo(
    () => sortReleases(Array.from(deferredState.releases.values())),
    [deferredState.releases],
  )
  crossFrames.push({
    active: active.map((release) => release._id),
    all: all.map((release) => release._id),
  })
  return null
}

/** Control: both real (synchronous) hooks over the same store. */
function SyncReleasesProbe() {
  const {data: active} = useActiveReleases()
  const {data: all} = useAllReleases()
  crossFrames.push({
    active: active.map((release) => release._id),
    all: all.map((release) => release._id),
  })
  return null
}

beforeEach(() => {
  releasesState$.next({releases: new Map(), state: 'initialising'})
  variantsState$.next({variants: new Map(), state: 'initialising'})
  selectedReleaseName$.next(undefined)
  selectedVariantName$.next(undefined)
  releaseFrames.length = 0
  variantFrames.length = 0
  crossFrames.length = 0
})

describe('deferral safety of useActiveReleases / useAllVariants / useAllReleases', () => {
  describe('release identity (PerspectiveProvider pairs the list with the live perspective name)', () => {
    it('sync (current): no frame pairs a selected release name with an unresolved release id', async () => {
      const wrapper = await createTestProvider()
      render(<SyncReleaseHarness />, {wrapper})

      // Model "create release, then navigate to it in the same handler": the
      // store emits the new release and the selection updates in one batch.
      act(() => {
        releasesState$.next(releasesLoaded)
        selectedReleaseName$.next(RELEASE_NAME)
      })

      expect(releaseFrames).toContainEqual({name: RELEASE_NAME, releaseId: RELEASE_NAME})
      // The frame a deferred list would produce must never be committed.
      expect(releaseFrames).not.toContainEqual({name: RELEASE_NAME, releaseId: undefined})
    })

    it('deferred (counterfactual): the selected release renders as unresolved for a frame', () => {
      render(<DeferredActiveReleasesCounterfactual />)

      act(() => {
        releasesState$.next(releasesLoaded)
        selectedReleaseName$.next(RELEASE_NAME)
      })

      // The tear: the new perspective name paired with the stale (empty)
      // deferred list — this is the frame the sync test proves never happens.
      expect(releaseFrames).toContainEqual({name: RELEASE_NAME, releaseId: undefined})
      // It converges afterwards, but consumers have already observed the
      // torn frame (e.g. reference create-in-place reading "no release").
      expect(releaseFrames[releaseFrames.length - 1]).toEqual({
        name: RELEASE_NAME,
        releaseId: RELEASE_NAME,
      })
    })
  })

  describe('variant identity (PerspectiveProvider pairs the map with the live variant name)', () => {
    it('sync (current): no frame pairs a selected variant name with an unresolved variant', async () => {
      const wrapper = await createTestProvider()
      render(<SyncVariantHarness />, {wrapper})

      act(() => {
        variantsState$.next(variantsLoaded)
        selectedVariantName$.next(VARIANT_NAME)
      })

      expect(variantFrames).toContainEqual({
        name: VARIANT_NAME,
        variantId: variantAlphaAudience._id,
      })
      expect(variantFrames).not.toContainEqual({name: VARIANT_NAME, variantId: undefined})
    })

    it('deferred (counterfactual): the selected variant renders as unresolved for a frame', () => {
      render(<DeferredAllVariantsCounterfactual />)

      act(() => {
        variantsState$.next(variantsLoaded)
        selectedVariantName$.next(VARIANT_NAME)
      })

      expect(variantFrames).toContainEqual({name: VARIANT_NAME, variantId: undefined})
      expect(variantFrames[variantFrames.length - 1]).toEqual({
        name: VARIANT_NAME,
        variantId: variantAlphaAudience._id,
      })
    })
  })

  describe('cross-hook coherence (useActiveReleases and useAllReleases read the same store)', () => {
    it('sync (current): active releases are always a subset of all releases', () => {
      render(<SyncReleasesProbe />)

      act(() => {
        releasesState$.next(releasesLoaded)
      })

      for (const frame of crossFrames) {
        for (const id of frame.active) {
          expect(frame.all).toContain(id)
        }
      }
      expect(crossFrames[crossFrames.length - 1]).toEqual({
        active: [activeASAPRelease._id],
        all: [activeASAPRelease._id],
      })
    })

    it('deferring only useAllReleases (counterfactual) commits the impossible state "active release missing from all releases"', () => {
      render(<MixedSyncDeferredReleasesProbe />)

      act(() => {
        releasesState$.next(releasesLoaded)
      })

      // The tear: the sync hook already contains the release while the
      // deferred read of the very same store snapshot does not. Consumers
      // pairing the two lists (e.g. document actions gating on membership)
      // cannot defend against this frame.
      expect(crossFrames).toContainEqual({active: [activeASAPRelease._id], all: []})
      expect(crossFrames[crossFrames.length - 1]).toEqual({
        active: [activeASAPRelease._id],
        all: [activeASAPRelease._id],
      })
    })
  })
})
