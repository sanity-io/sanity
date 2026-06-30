import {type ReleaseDocument} from '@sanity/client'
import {BehaviorSubject, of} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'
import {createActor, fromObservable, fromPromise} from 'xstate'

import {getReleaseDocumentIdFromReleaseId} from '../../releases/util/getReleaseDocumentIdFromReleaseId'
import {deletionMachine} from './deletionMachine'
import {documentGroupInventoryMachine, type Meta} from './documentGroupInventoryMachine'
import {selectionMachine} from './selectionMachine'

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

// Minimal meta that drives the selection machine straight to `ready`.
const loadedMeta = {
  versionState: {data: ['drafts.foo', 'foo'], loading: false, error: null},
  releases: {releases: new Map(), state: 'loaded' as const},
} as unknown as Meta

function createTestActor(
  initial: ReferringDocuments,
  {
    requestDeletionConfirmation,
    deleteVariants,
    meta = loadedMeta,
  }: {
    requestDeletionConfirmation?: () => void
    deleteVariants?: () => Promise<unknown>
    meta?: Meta
  } = {},
) {
  const references$ = new BehaviorSubject<ReferringDocuments>(initial)

  const inventoryRef = createActor(
    documentGroupInventoryMachine.provide({
      actors: {meta: fromObservable(() => of(meta))},
    }),
    {
      input: {
        selectionMachine,
        deletionMachine: deletionMachine.provide({
          actors: {
            referringDocuments: fromObservable(() => references$),
            deleteVariants: fromPromise(async () => {
              // Defaults to a resolving no-op; tests override to exercise outcomes.
              if (deleteVariants) return deleteVariants()
              return undefined
            }),
          },
          actions: requestDeletionConfirmation ? {requestDeletionConfirmation} : {},
        }),
      },
    },
  )
  inventoryRef.start()

  const {selectionRef, deletionRef} = inventoryRef.getSnapshot().context

  return {inventoryRef, selectionRef, deletionRef, references$}
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
    const meta = {
      versionState: {
        data: ['drafts.foo', 'foo', 'versions.rABC.foo', 'versions.rXYZ.foo'],
        loading: false,
        error: null,
      },
      releases: {releases, state: 'loaded' as const},
    } as unknown as Meta

    const expectedVariants = [
      {id: 'drafts.foo', name: 'Draft'},
      {id: 'foo', name: 'Published'},
      {id: 'versions.rABC.foo', name: 'My Release'},
      // Falls back to the raw id when the release metadata is unknown.
      {id: 'versions.rXYZ.foo', name: 'versions.rXYZ.foo'},
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

  it('drives the selection machine into the error state when meta reports an error', () => {
    const meta = {
      versionState: {data: [], loading: false, error: new Error('meta failed')},
      releases: {releases: new Map(), state: 'loaded' as const},
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
})
