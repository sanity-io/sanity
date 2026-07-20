import {type MultipleMutationResult, type ReleaseDocument} from '@sanity/client'
import {BehaviorSubject, isObservable, of, type Observable} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'
import {createActor, fromObservable, fromPromise} from 'xstate'

import {type TFunction} from '../../i18n/types'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {getReleaseDocumentIdFromReleaseId} from '../../releases/util/getReleaseDocumentIdFromReleaseId'
import {getPublishedId, getVersionFromId, isDraftId, isVersionId} from '../../util/draftUtils'
import {deletionMachine} from './deletionMachine'
import {documentGroupInventoryMachine, type Meta} from './documentGroupInventoryMachine'
import {selectionMachine} from './selectionMachine'
import {variantCreationMachine} from './variantCreationMachine'

interface IncomingReference {
  _id: string
  _type: string
}

interface ReferringDocuments {
  isLoading: boolean
  totalCount: number
  projectIds: string[]
  datasetNames: string[]
  hasUnknownDatasetNames: boolean
  internalReferences?: {
    totalCount: number
    references: IncomingReference[]
  }
  crossDatasetReferences?: {
    totalCount: number
    references: Array<{projectId: string; documentId?: string; datasetName?: string}>
  }
}

function emission(overrides: Partial<ReferringDocuments> = {}): ReferringDocuments {
  return {
    isLoading: false,
    totalCount: 0,
    projectIds: [],
    datasetNames: [],
    hasUnknownDatasetNames: false,
    ...overrides,
  }
}

const loading: ReferringDocuments = emission({isLoading: true})

const bookReference: IncomingReference = {_id: 'bar', _type: 'book'}

type CrossDatasetReference = NonNullable<
  ReferringDocuments['crossDatasetReferences']
>['references'][number]

const crossDatasetReference: CrossDatasetReference = {
  projectId: 'other-project',
  documentId: 'baz',
  datasetName: 'production',
}

// Builds the nested `internalReferences` group the way the referring-documents
// observable emits it.
function withInternalReferences(references: IncomingReference[]): Partial<ReferringDocuments> {
  return {internalReferences: {totalCount: references.length, references}}
}

// Builds the nested `crossDatasetReferences` group the way the
// referring-documents observable emits it.
function withCrossDatasetReferences(
  references: CrossDatasetReference[],
): Partial<ReferringDocuments> {
  return {crossDatasetReferences: {totalCount: references.length, references}}
}

// Loaded variants store state with no variants, the way the component wires
// it up when the variants feature is disabled.
const loadedVariants: Meta['variants'] = {variants: new Map(), state: 'loaded'}

// Stores the variant creation machine resolves its captured inputs against.
// The releases map is keyed by whatever id `createVariant.selectBundle`
// carries, mirroring how `SelectBundle` sends the store's map key.
const creationVariants = {
  variants: new Map([['variant-a', {_id: 'variant-a', name: 'Variant A'}]]),
  state: 'loaded',
} as unknown as Meta['variants']

const creationReleases = {
  releases: new Map([['rABC', {_id: 'rABC'}]]),
  state: 'loaded',
} as unknown as Meta['releases']

// Builds the version document stub the way `useDocumentVersions` emits it,
// deriving `_system` from the document id.
function versionStub(id: string): VersionInfoDocumentStub {
  const bundleId = getVersionFromId(id)
  const group = {_ref: getPublishedId(id), _weak: true} as const

  return {
    _id: id,
    _rev: 'rev',
    _createdAt: '2024-01-01T00:00:00.000Z',
    _updatedAt: '2024-01-01T00:00:00.000Z',
    _system: isDraftId(id)
      ? {bundleId: 'drafts', group}
      : isVersionId(id) && typeof bundleId === 'string'
        ? {
            bundleId,
            release: {_ref: getReleaseDocumentIdFromReleaseId(bundleId), _weak: true},
            group,
          }
        : {group},
  }
}

// Minimal meta that drives the selection machine straight to `ready`.
const loadedMeta = {
  versionState: {
    data: ['drafts.foo', 'foo'],
    versions: [versionStub('drafts.foo'), versionStub('foo')],
    loading: false,
    error: null,
  },
  releases: {releases: new Map(), state: 'loaded' as const},
  variants: loadedVariants,
  agentBundles: {bundles: [], loading: false},
} as unknown as Meta

const t = ((key: string) => key) as unknown as TFunction

function createTestActor(
  initial: ReferringDocuments,
  {
    requestDeletionConfirmation,
    deleteVariants,
    createVariant,
    meta = loadedMeta,
  }: {
    requestDeletionConfirmation?: () => void
    deleteVariants?: () => Promise<unknown>
    createVariant?: () => Promise<unknown>
    meta?: Meta | Observable<Meta>
  } = {},
) {
  const references$ = new BehaviorSubject<ReferringDocuments>(initial)

  const inventoryRef = createActor(
    documentGroupInventoryMachine.provide({
      actors: {meta: fromObservable(() => (isObservable(meta) ? meta : of(meta)))},
    }),
    {
      input: {
        selectionMachine,
        t,
        // These tests exercise the flat variant list; grouped variant sets are
        // gated behind the variants feature flag.
        variantsEnabled: false,
        deletionMachine: deletionMachine.provide({
          actors: {
            deleteVariants: fromPromise<MultipleMutationResult, {ids: string[]}>(async () => {
              // Defaults to a resolving no-op; tests override to exercise
              // outcomes. The mutation result is never inspected by the
              // machine, so a stub suffices.
              if (deleteVariants) await deleteVariants()
              return {transactionId: 'stub', documentIds: [], results: []}
            }),
            referringDocuments: fromObservable(() => references$),
          },
          actions: requestDeletionConfirmation ? {requestDeletionConfirmation} : {},
        }),
        variantCreationMachine: variantCreationMachine.provide({
          actors: {
            variants: fromObservable(() => of(creationVariants)),
            releases: fromObservable(() => of(creationReleases)),
            createVariant: fromPromise(async () => {
              // Defaults to a resolving no-op; tests override to exercise
              // outcomes.
              if (createVariant) await createVariant()
            }),
          },
        }),
      },
    },
  )
  inventoryRef.start()

  const {selectionRef, deletionRef, variantCreationRef} = inventoryRef.getSnapshot().context

  return {inventoryRef, selectionRef, deletionRef, variantCreationRef, references$}
}

describe('documentGroupInventoryMachine', () => {
  it('keeps the deletion ids in sync as the selection machine toggles them', () => {
    const {selectionRef, deletionRef} = createTestActor(loading)

    expect(selectionRef.getSnapshot().matches('ready')).toBe(true)

    selectionRef.send({type: 'selection.toggle', variantId: 'drafts.foo'})
    expect(deletionRef.getSnapshot().context.ids).toEqual(['drafts.foo'])

    selectionRef.send({type: 'selection.toggle', variantId: 'foo'})
    expect(deletionRef.getSnapshot().context.ids).toEqual(['drafts.foo', 'foo'])

    selectionRef.send({type: 'selection.toggle', variantId: 'drafts.foo'})
    expect(deletionRef.getSnapshot().context.ids).toEqual(['foo'])

    selectionRef.send({type: 'selection.clear'})
    expect(deletionRef.getSnapshot().context.ids).toEqual([])
  })

  it('rests in idle until a deletion is requested', () => {
    const {selectionRef, deletionRef} = createTestActor(loading)

    // Selecting documents while idle does not start the preparation flow.
    selectionRef.send({type: 'selection.toggle', variantId: 'drafts.foo'})
    expect(deletionRef.getSnapshot().matches('idle')).toBe(true)

    // Requesting deletion enters the preparation flow against the selected ids.
    deletionRef.send({type: 'delete.request'})
    expect(deletionRef.getSnapshot().matches({active: {deletion: 'preparing'}})).toBe(true)
    expect(deletionRef.getSnapshot().context.ids).toEqual(['drafts.foo'])
  })

  it('only allows requesting deletion when something is selected', () => {
    const {selectionRef, deletionRef} = createTestActor(loading)

    // No selection yet: the request is ignored and we stay idle.
    deletionRef.send({type: 'delete.request'})
    expect(deletionRef.getSnapshot().matches('idle')).toBe(true)

    // With a selection, the request is allowed.
    selectionRef.send({type: 'selection.toggle', variantId: 'drafts.foo'})
    deletionRef.send({type: 'delete.request'})
    expect(deletionRef.getSnapshot().matches({active: {deletion: 'preparing'}})).toBe(true)
  })

  it('keeps checking references and awaiting confirmation in parallel once requested', () => {
    const {selectionRef, deletionRef} = createTestActor(loading)

    selectionRef.send({type: 'selection.toggle', variantId: 'drafts.foo'})
    deletionRef.send({type: 'delete.request'})

    expect(deletionRef.getSnapshot().value).toMatchObject({
      active: {
        deletion: {
          preparing: {checkingIncomingReferences: 'checking', awaitingDeletionConfirmation: {}},
        },
      },
    })
  })

  it('requests deletion confirmation when entering the confirmation state', () => {
    const requestDeletionConfirmation = vi.fn()
    const {selectionRef, deletionRef} = createTestActor(loading, {requestDeletionConfirmation})

    // Not triggered while idle.
    selectionRef.send({type: 'selection.toggle', variantId: 'drafts.foo'})
    expect(requestDeletionConfirmation).not.toHaveBeenCalled()

    // Triggered once on entering the confirmation state after a request.
    deletionRef.send({type: 'delete.request'})
    expect(requestDeletionConfirmation).toHaveBeenCalledTimes(1)
  })

  it('returns to idle when a requested deletion is cancelled', () => {
    const {selectionRef, deletionRef} = createTestActor(loading)

    selectionRef.send({type: 'selection.toggle', variantId: 'drafts.foo'})
    deletionRef.send({type: 'delete.request'})
    expect(deletionRef.getSnapshot().matches({active: {deletion: 'preparing'}})).toBe(true)

    deletionRef.send({type: 'delete.cancel'})
    expect(deletionRef.getSnapshot().matches('idle')).toBe(true)
    // Cancelling only abandons the deletion flow; the underlying selection is
    // owned by the selection machine and is intentionally left untouched.
    expect(deletionRef.getSnapshot().context.ids).toEqual(['drafts.foo'])
  })

  it('allows confirmation while references are still loading when no published id is selected', () => {
    const {selectionRef, deletionRef} = createTestActor(loading)

    selectionRef.send({type: 'selection.toggle', variantId: 'drafts.foo'})
    selectionRef.send({type: 'selection.toggle', variantId: 'versions.r.foo'})
    deletionRef.send({type: 'delete.request'})
    deletionRef.send({type: 'delete.confirm'})

    expect(deletionRef.getSnapshot().matches({active: {deletion: 'deleting'}})).toBe(true)
  })

  it('locks the selection while a deletion is active and unlocks it when idle', () => {
    const {selectionRef, deletionRef} = createTestActor(loading)

    selectionRef.send({type: 'selection.toggle', variantId: 'drafts.foo'})
    expect(selectionRef.getSnapshot().matches('ready')).toBe(true)

    // Requesting deletion activates the flow, which locks the selection.
    deletionRef.send({type: 'delete.request'})
    expect(selectionRef.getSnapshot().matches('readonly')).toBe(true)

    // While locked, selection changes are ignored, so the target ids are frozen.
    selectionRef.send({type: 'selection.clear'})
    expect(deletionRef.getSnapshot().context.ids).toEqual(['drafts.foo'])

    // Returning to idle unlocks the selection again.
    deletionRef.send({type: 'delete.cancel'})
    expect(selectionRef.getSnapshot().matches('ready')).toBe(true)
  })

  it('blocks confirmation while references are loading when a published id is selected', () => {
    const {selectionRef, deletionRef, references$} = createTestActor(loading)

    selectionRef.send({type: 'selection.toggle', variantId: 'foo'})
    deletionRef.send({type: 'delete.request'})

    // Confirm is ignored while the reference check is still in flight.
    deletionRef.send({type: 'delete.confirm'})
    expect(deletionRef.getSnapshot().matches({active: {deletion: 'deleting'}})).toBe(false)
    expect(
      deletionRef
        .getSnapshot()
        .matches({active: {deletion: {preparing: {checkingIncomingReferences: 'checking'}}}}),
    ).toBe(true)

    // Once the references have loaded, confirmation is permitted.
    references$.next(emission(withInternalReferences([bookReference])))
    expect(
      deletionRef
        .getSnapshot()
        .matches({active: {deletion: {preparing: {checkingIncomingReferences: 'checked'}}}}),
    ).toBe(true)
    expect(deletionRef.getSnapshot().context.internalReferences?.references).toEqual([
      bookReference,
    ])

    deletionRef.send({type: 'delete.confirm'})
    expect(deletionRef.getSnapshot().matches({active: {deletion: 'deleting'}})).toBe(true)
  })

  it('warns about incoming references when a referenced published document is selected', () => {
    const {selectionRef, deletionRef, references$} = createTestActor(loading)

    selectionRef.send({type: 'selection.toggle', variantId: 'foo'})
    deletionRef.send({type: 'delete.request'})

    // No warning yet: the incoming references haven't loaded.
    expect(deletionRef.getSnapshot().hasTag('warnIncomingReferences')).toBe(false)

    // Once references load, the warning becomes active.
    references$.next(emission(withInternalReferences([bookReference])))
    expect(deletionRef.getSnapshot().hasTag('warnIncomingReferences')).toBe(true)
  })

  it('warns about incoming references when a published document has cross-dataset references', () => {
    const {selectionRef, deletionRef, references$} = createTestActor(loading)

    selectionRef.send({type: 'selection.toggle', variantId: 'foo'})
    deletionRef.send({type: 'delete.request'})

    // No warning yet: the references haven't loaded.
    expect(deletionRef.getSnapshot().hasTag('warnIncomingReferences')).toBe(false)

    // Cross-dataset references alone are enough to activate the warning.
    references$.next(emission(withCrossDatasetReferences([crossDatasetReference])))
    expect(deletionRef.getSnapshot().hasTag('warnIncomingReferences')).toBe(true)
  })

  it('does not warn when only drafts or versions are selected', () => {
    const {selectionRef, deletionRef, references$} = createTestActor(loading)

    selectionRef.send({type: 'selection.toggle', variantId: 'drafts.foo'})
    deletionRef.send({type: 'delete.request'})
    references$.next(emission(withInternalReferences([bookReference])))

    expect(deletionRef.getSnapshot().hasTag('warnIncomingReferences')).toBe(false)
  })

  it('does not warn when a published document has no incoming references', () => {
    const {selectionRef, deletionRef, references$} = createTestActor(loading)

    selectionRef.send({type: 'selection.toggle', variantId: 'foo'})
    deletionRef.send({type: 'delete.request'})
    references$.next(emission(withInternalReferences([])))

    expect(deletionRef.getSnapshot().hasTag('warnIncomingReferences')).toBe(false)
  })

  it('stores the full referring documents data in context once loaded', () => {
    const {selectionRef, deletionRef, references$} = createTestActor(loading)

    selectionRef.send({type: 'selection.toggle', variantId: 'drafts.foo'})
    deletionRef.send({type: 'delete.request'})

    const internalReferences = {totalCount: 1, references: [bookReference]}
    const crossDatasetReferences = {
      totalCount: 1,
      references: [{projectId: 'p1', documentId: 'd1', datasetName: 'production'}],
    }

    references$.next(
      emission({
        totalCount: 2,
        projectIds: ['p1'],
        datasetNames: ['production'],
        hasUnknownDatasetNames: true,
        internalReferences,
        crossDatasetReferences,
      }),
    )

    const {context} = deletionRef.getSnapshot()
    expect(context.internalReferences).toEqual(internalReferences)
    expect(context.crossDatasetReferences).toEqual(crossDatasetReferences)
    expect(context.projectIds).toEqual(['p1'])
    expect(context.datasetNames).toEqual(['production'])
    expect(context.hasUnknownDatasetNames).toBe(true)
  })

  it('captures the thrown value in context when the reference check fails', () => {
    const {selectionRef, deletionRef, references$} = createTestActor(loading)

    selectionRef.send({type: 'selection.toggle', variantId: 'drafts.foo'})
    deletionRef.send({type: 'delete.request'})

    const failure = new Error('reference lookup failed')
    references$.error(failure)

    expect(deletionRef.getSnapshot().matches({active: {deletion: 'error'}})).toBe(true)
    expect(deletionRef.getSnapshot().context.error).toBe(failure)
  })

  it('returns to idle and unlocks the selection after a successful deletion', async () => {
    const {selectionRef, deletionRef} = createTestActor(loading, {
      deleteVariants: async () => undefined,
    })

    selectionRef.send({type: 'selection.toggle', variantId: 'drafts.foo'})
    deletionRef.send({type: 'delete.request'})
    deletionRef.send({type: 'delete.confirm'})
    expect(deletionRef.getSnapshot().matches({active: {deletion: 'deleting'}})).toBe(true)

    // Once the deletion mutation resolves the flow returns to idle...
    await vi.waitFor(() => expect(deletionRef.getSnapshot().matches('idle')).toBe(true))
    // ...and the selection, locked while deleting, is unlocked again.
    expect(selectionRef.getSnapshot().matches('ready')).toBe(true)
  })

  it('preserves the incoming reference warning while deleting', () => {
    // Keep the deletion mutation in flight so the flow rests in `deleting`.
    let resolveDeletion: (() => void) | undefined
    const {selectionRef, deletionRef, references$} = createTestActor(loading, {
      deleteVariants: () =>
        new Promise<void>((resolve) => {
          resolveDeletion = resolve
        }),
    })

    selectionRef.send({type: 'selection.toggle', variantId: 'foo'})
    deletionRef.send({type: 'delete.request'})

    // The published id has incoming references, so the warning becomes active.
    references$.next(emission(withInternalReferences([bookReference])))
    expect(deletionRef.getSnapshot().hasTag('warnIncomingReferences')).toBe(true)

    // Confirming advances the flow into `deleting`, which now runs parallel to
    // the incoming reference warning instead of replacing it.
    deletionRef.send({type: 'delete.confirm'})
    expect(deletionRef.getSnapshot().matches({active: {deletion: 'deleting'}})).toBe(true)
    expect(deletionRef.getSnapshot().hasTag('warnIncomingReferences')).toBe(true)

    resolveDeletion?.()
  })

  it('captures the thrown value and enters the error state when deletion fails', async () => {
    const failure = new Error('delete mutation failed')
    const {selectionRef, deletionRef} = createTestActor(loading, {
      deleteVariants: async () => {
        throw failure
      },
    })

    selectionRef.send({type: 'selection.toggle', variantId: 'drafts.foo'})
    deletionRef.send({type: 'delete.request'})
    deletionRef.send({type: 'delete.confirm'})

    await vi.waitFor(() =>
      expect(deletionRef.getSnapshot().matches({active: {deletion: 'error'}})).toBe(true),
    )
    expect(deletionRef.getSnapshot().context.error).toBe(failure)
  })

  it('forwards the meta observable down to the selection machine', () => {
    const {selectionRef} = createTestActor(loading)

    // The meta observable is owned here and relayed to the selection machine,
    // which advances to `ready` once it has loaded.
    expect(selectionRef.getSnapshot().matches('ready')).toBe(true)
  })

  it('derives variant sets and relays the flat variants to the selection machine', () => {
    const release = {metadata: {title: 'My Release'}} as unknown as ReleaseDocument
    const releases = new Map<string, ReleaseDocument>([
      [getReleaseDocumentIdFromReleaseId('rABC'), release],
    ])
    const data = ['drafts.foo', 'foo', 'versions.rABC.foo', 'versions.rXYZ.foo']
    const meta = {
      versionState: {
        data,
        versions: data.map(versionStub),
        loading: false,
        error: null,
      },
      releases: {releases, state: 'loaded' as const},
      variants: loadedVariants,
      agentBundles: {bundles: [], loading: false},
    } as unknown as Meta

    const expectedVariants = [
      {id: 'drafts.foo', name: 'release.chip.draft', document: versionStub('drafts.foo')},
      {id: 'foo', name: 'release.chip.published', document: versionStub('foo')},
      {id: 'versions.rABC.foo', name: 'My Release', document: versionStub('versions.rABC.foo')},
      // Falls back to the release ref when the release metadata is unknown.
      {
        id: 'versions.rXYZ.foo',
        name: getReleaseDocumentIdFromReleaseId('rXYZ'),
        document: versionStub('versions.rXYZ.foo'),
      },
    ]

    const {inventoryRef, selectionRef} = createTestActor(loading, {meta})

    // The inventory machine owns the rendered sets and the releases map.
    const {sets, releases: storedReleases} = inventoryRef.getSnapshot().context
    expect(sets).toHaveLength(1)
    expect(sets[0].key).toBe('studio:all')
    expect(sets[0].variants).toEqual(expectedVariants)
    expect(storedReleases).toBe(releases)

    // Only the flat list of variants is relayed down to the selection machine.
    expect(selectionRef.getSnapshot().context.variants).toEqual(expectedVariants)
  })

  it('surfaces the most recent agent bundle and hides agent bundle versions from the version state', () => {
    const data = ['drafts.foo', 'foo', 'versions.agent-abc.foo']
    const meta = {
      versionState: {
        data,
        versions: data.map(versionStub),
        loading: false,
        error: null,
      },
      releases: {releases: new Map(), state: 'loaded' as const},
      variants: loadedVariants,
      agentBundles: {
        bundles: [
          {id: 'agent-abc', applicationKey: 'app-1'},
          {id: 'agent-def', applicationKey: 'app-2'},
        ],
        loading: false,
      },
    } as unknown as Meta

    const expectedVariants = [
      // Agent bundle versions are dropped from the version state and only the
      // most recent bundle is prepended, labelled through the translator.
      {id: 'versions.agent-abc.foo', name: 'version.agent-bundle.proposed-changes'},
      {id: 'drafts.foo', name: 'release.chip.draft', document: versionStub('drafts.foo')},
      {id: 'foo', name: 'release.chip.published', document: versionStub('foo')},
    ]

    const {inventoryRef, selectionRef} = createTestActor(loading, {meta})

    const {sets} = inventoryRef.getSnapshot().context
    expect(sets).toHaveLength(1)
    expect(sets[0].variants).toEqual(expectedVariants)
    expect(selectionRef.getSnapshot().context.variants).toEqual(expectedVariants)
  })

  it('reports meta as pending until every meta observable has settled', () => {
    const meta$ = new BehaviorSubject<Meta>({
      ...loadedMeta,
      releases: {releases: new Map(), state: 'loading'},
      agentBundles: {bundles: [], loading: true},
    })

    const {inventoryRef} = createTestActor(loading, {meta: meta$})
    expect(inventoryRef.getSnapshot().context.metaState).toBe('pending')

    // A single slice settling is not enough while others are still loading.
    meta$.next({...meta$.getValue(), agentBundles: {bundles: [], loading: false}})
    expect(inventoryRef.getSnapshot().context.metaState).toBe('pending')

    meta$.next(loadedMeta)
    expect(inventoryRef.getSnapshot().context.metaState).toBe('ready')
  })

  it('keeps meta ready once settled, even if a slice starts loading again', () => {
    const meta$ = new BehaviorSubject<Meta>(loadedMeta)

    const {inventoryRef} = createTestActor(loading, {meta: meta$})
    expect(inventoryRef.getSnapshot().context.metaState).toBe('ready')

    // Refetches (e.g. the releases store reloading) must not flip the
    // inventory back to pending.
    meta$.next({...loadedMeta, releases: {releases: new Map(), state: 'loading'}})
    expect(inventoryRef.getSnapshot().context.metaState).toBe('ready')
  })

  it('drives the selection machine into the error state when meta reports an error', () => {
    const meta = {
      versionState: {data: [], versions: [], loading: false, error: new Error('meta failed')},
      releases: {releases: new Map(), state: 'loaded' as const},
      variants: loadedVariants,
      agentBundles: {bundles: [], loading: false},
    } as unknown as Meta

    const {selectionRef} = createTestActor(loading, {meta})
    expect(selectionRef.getSnapshot().matches('error')).toBe(true)
  })

  it('stops warning about incoming references when the published id leaves the selection', () => {
    const {selectionRef, deletionRef, references$} = createTestActor(loading)

    selectionRef.send({type: 'selection.toggle', variantId: 'foo'})
    deletionRef.send({type: 'delete.request'})
    references$.next(emission(withInternalReferences([bookReference])))
    expect(deletionRef.getSnapshot().hasTag('warnIncomingReferences')).toBe(true)

    // The selection is locked while deleting, but the deletion machine still
    // reacts to `selection.changed` at the root; drive it directly to drop the
    // published id and confirm the warning clears.
    deletionRef.send({type: 'selection.changed', selectedIds: new Set(['drafts.foo'])})
    expect(deletionRef.getSnapshot().context.ids).toEqual(['drafts.foo'])
    expect(deletionRef.getSnapshot().hasTag('warnIncomingReferences')).toBe(false)
  })

  it('mirrors variant creation activity in the creatingVariant state', () => {
    const {inventoryRef, variantCreationRef} = createTestActor(loading)

    expect(inventoryRef.getSnapshot().matches('idle')).toBe(true)

    // Requesting creation activates the flow, which the parent mirrors.
    variantCreationRef.send({type: 'createVariant.request'})
    expect(variantCreationRef.getSnapshot().matches({active: 'configuring'})).toBe(true)
    expect(inventoryRef.getSnapshot().matches('creatingVariant')).toBe(true)

    // Cancelling deactivates the flow and returns the parent to idle.
    variantCreationRef.send({type: 'createVariant.cancel'})
    expect(variantCreationRef.getSnapshot().matches('idle')).toBe(true)
    expect(inventoryRef.getSnapshot().matches('idle')).toBe(true)
  })

  it('only allows confirming variant creation once both inputs are captured', () => {
    const {variantCreationRef} = createTestActor(loading)

    variantCreationRef.send({type: 'createVariant.request'})

    // Neither input captured: confirmation is ignored.
    variantCreationRef.send({type: 'createVariant.confirm'})
    expect(variantCreationRef.getSnapshot().matches({active: 'configuring'})).toBe(true)

    // The inputs are independent and may be captured in any order.
    variantCreationRef.send({type: 'createVariant.selectBundle', bundle: {type: 'drafts'}})
    variantCreationRef.send({type: 'createVariant.confirm'})
    expect(variantCreationRef.getSnapshot().matches({active: 'configuring'})).toBe(true)

    variantCreationRef.send({type: 'createVariant.selectVariant', variantId: 'variant-a'})
    variantCreationRef.send({type: 'createVariant.confirm'})
    expect(variantCreationRef.getSnapshot().matches({active: 'creating'})).toBe(true)
  })

  it('creates the variant with the captured inputs and returns to idle', async () => {
    const createVariant = vi.fn().mockResolvedValue(undefined)
    const {inventoryRef, variantCreationRef} = createTestActor(loading, {createVariant})

    variantCreationRef.send({type: 'createVariant.request'})
    variantCreationRef.send({type: 'createVariant.selectVariant', variantId: 'variant-a'})
    variantCreationRef.send({
      type: 'createVariant.selectBundle',
      bundle: {type: 'release', releaseId: 'rABC'},
    })
    variantCreationRef.send({type: 'createVariant.confirm'})

    await vi.waitFor(() => expect(variantCreationRef.getSnapshot().matches('idle')).toBe(true))
    expect(createVariant).toHaveBeenCalledTimes(1)
    expect(inventoryRef.getSnapshot().matches('idle')).toBe(true)

    // Abandoned or completed selections are not carried into the next flow.
    expect(variantCreationRef.getSnapshot().context.selectedVariantId).toBeUndefined()
    expect(variantCreationRef.getSnapshot().context.selectedBundle).toBeUndefined()
  })

  it('captures the thrown value and enters the error state when variant creation fails', async () => {
    const failure = new Error('create variant failed')
    const {variantCreationRef} = createTestActor(loading, {
      createVariant: async () => {
        throw failure
      },
    })

    variantCreationRef.send({type: 'createVariant.request'})
    variantCreationRef.send({type: 'createVariant.selectVariant', variantId: 'variant-a'})
    variantCreationRef.send({type: 'createVariant.selectBundle', bundle: {type: 'drafts'}})
    variantCreationRef.send({type: 'createVariant.confirm'})

    await vi.waitFor(() =>
      expect(variantCreationRef.getSnapshot().matches({active: 'error'})).toBe(true),
    )
    expect(variantCreationRef.getSnapshot().context.error).toBe(failure)
  })

  it('ignores bundle selection and confirmation while the variant is being created', () => {
    // A never-resolving creation keeps the machine in the `creating` state.
    const createVariant = vi.fn(() => new Promise<void>(() => {}))
    const {variantCreationRef} = createTestActor(loading, {createVariant})

    variantCreationRef.send({type: 'createVariant.request'})
    variantCreationRef.send({type: 'createVariant.selectVariant', variantId: 'variant-a'})
    variantCreationRef.send({type: 'createVariant.selectBundle', bundle: {type: 'drafts'}})
    variantCreationRef.send({type: 'createVariant.confirm'})
    expect(variantCreationRef.getSnapshot().matches({active: 'creating'})).toBe(true)

    // The captured bundle cannot be changed mid-creation.
    variantCreationRef.send({
      type: 'createVariant.selectBundle',
      bundle: {type: 'release', releaseId: 'rABC'},
    })
    expect(variantCreationRef.getSnapshot().context.selectedBundle).toEqual({type: 'drafts'})

    // Confirmation cannot start a second creation.
    variantCreationRef.send({type: 'createVariant.confirm'})
    expect(variantCreationRef.getSnapshot().matches({active: 'creating'})).toBe(true)
    expect(createVariant).toHaveBeenCalledTimes(1)
  })

  it('does not leave the feedback state when variant creation deactivates', () => {
    const {inventoryRef, variantCreationRef} = createTestActor(loading)

    variantCreationRef.send({type: 'createVariant.request'})
    expect(inventoryRef.getSnapshot().matches('creatingVariant')).toBe(true)

    // Feedback takes over the parent state while the creation flow is active.
    inventoryRef.send({type: 'feedback.begin'})
    expect(inventoryRef.getSnapshot().matches('feedback')).toBe(true)

    // Deactivation must not yank the machine out of the feedback state.
    variantCreationRef.send({type: 'createVariant.cancel'})
    expect(inventoryRef.getSnapshot().matches('feedback')).toBe(true)

    inventoryRef.send({type: 'feedback.end'})
    expect(inventoryRef.getSnapshot().matches('idle')).toBe(true)
  })
})
