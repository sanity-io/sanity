import {type ReleaseDocument} from '@sanity/client'
import {act, render} from '@testing-library/react'
import {useMemo} from 'react'
import {useObservable, useSyncObservable} from 'react-rx'
import {BehaviorSubject} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {activeASAPRelease} from '../../releases/__fixtures__/release.fixture'
import {sortReleases} from '../../releases/hooks/utils'
import {INITIAL_RELEASES_STATE} from '../../releases/store/createReleaseStore'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {useAllReleases} from '../../releases/store/useAllReleases'
import {useReleasesStore} from '../../releases/store/useReleasesStore'
import {ARCHIVED_RELEASE_STATES} from '../../releases/util/const'
import {variantAlphaAudience} from '../../variants/__fixtures__/variants.fixture'
import {INITIAL_VARIANTS_STATE} from '../../variants/store/createVariantsStore'
import {type VariantStoreState} from '../../variants/store/reducer'
import {useVariantsStore} from '../../variants/store/useVariantsStore'
import {getSelectedReleaseId} from '../getSelectedReleaseId'
import {getSelectedVariant} from '../getSelectedVariant'
import {PerspectiveProvider} from '../PerspectiveProvider'
import {type ReleaseId} from '../types'
import {usePerspective} from '../usePerspective'

/**
 * These store observables have stable identities, so deferred reads lag behind router-driven
 * selection instead of switching to a live snapshot.
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

const releaseFrames: {name: string | undefined; releaseId: string | undefined}[] = []
const variantFrames: {name: string | undefined; variantId: string | undefined}[] = []
const crossFrames: {active: string[]; all: string[]}[] = []

function ReleaseIdProbe() {
  const {selectedPerspectiveName, selectedReleaseId} = usePerspective()
  releaseFrames.push({name: selectedPerspectiveName, releaseId: selectedReleaseId})
  return null
}

function SyncReleaseHarness() {
  const name = useSyncObservable(selectedReleaseName$, undefined)
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
  const name = useSyncObservable(selectedVariantName$, undefined)
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

function DeferredActiveReleasesCounterfactual() {
  const name = useSyncObservable(selectedReleaseName$, undefined)
  const {state$} = useReleasesStore()
  const state = useObservable(state$, INITIAL_RELEASES_STATE)
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

function DeferredAllVariantsCounterfactual() {
  const name = useSyncObservable(selectedVariantName$, undefined)
  const {state$} = useVariantsStore()
  const {variants} = useObservable(state$, INITIAL_VARIANTS_STATE)
  variantFrames.push({
    name,
    variantId: getSelectedVariant({selectedVariantName: name, variantsById: variants})?._id,
  })
  return null
}

function MixedSyncDeferredReleasesProbe() {
  const {data: active} = useActiveReleases()
  const {state$} = useReleasesStore()
  const deferredState = useObservable(state$, INITIAL_RELEASES_STATE)
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

      act(() => {
        releasesState$.next(releasesLoaded)
        selectedReleaseName$.next(RELEASE_NAME)
      })

      expect(releaseFrames).toContainEqual({name: RELEASE_NAME, releaseId: RELEASE_NAME})
      expect(releaseFrames).not.toContainEqual({name: RELEASE_NAME, releaseId: undefined})
    })

    it('deferred (counterfactual): the selected release renders as unresolved for a frame', () => {
      render(<DeferredActiveReleasesCounterfactual />)

      act(() => {
        releasesState$.next(releasesLoaded)
        selectedReleaseName$.next(RELEASE_NAME)
      })

      expect(releaseFrames).toContainEqual({name: RELEASE_NAME, releaseId: undefined})
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

      expect(crossFrames).toContainEqual({active: [activeASAPRelease._id], all: []})
      expect(crossFrames[crossFrames.length - 1]).toEqual({
        active: [activeASAPRelease._id],
        all: [activeASAPRelease._id],
      })
    })
  })
})
