import {type MultipleMutationResult} from '@sanity/client'
import {BehaviorSubject} from 'rxjs'
import {describe, expect, it} from 'vitest'
import {
  type ActorRefFromLogic,
  createActor,
  fromObservable,
  fromPromise,
  setup,
  waitFor,
} from 'xstate'

import {deletionMachine, type IncomingReference, type ReferringDocuments} from './deletionMachine'

const PUBLISHED_ID = 'book-lighthouse'
const VARIANT_DRAFT_ID = `versions.scope-a.${PUBLISHED_ID}`
const DRAFT_ID = `drafts.${PUBLISHED_ID}`

function referringDocuments(references: IncomingReference[]): ReferringDocuments {
  return {
    isLoading: false,
    totalCount: references.length,
    projectIds: [],
    datasetNames: [],
    hasUnknownDatasetNames: false,
    internalReferences: {totalCount: references.length, references},
    crossDatasetReferences: {totalCount: 0, references: []},
  }
}

/**
 * The machine reports to a parent (`deletion.activated` / `deletion.deactivated`), so it runs as a
 * child of a minimal parent, as in `documentGroupInventoryMachine`.
 */
function start(
  references: IncomingReference[],
  selectedIds: string[],
  options?: {failFirstDelete?: boolean; versionIds?: string[]; variantIds?: string[]},
) {
  const deleted: string[][] = []
  const deletion = deletionMachine.provide({
    actors: {
      referringDocuments: fromObservable(() => new BehaviorSubject(referringDocuments(references))),
      deleteVariants: fromPromise(async ({input}) => {
        deleted.push(input.ids)
        if (options?.failFirstDelete && deleted.length === 1) throw new Error('network')
        return {} as MultipleMutationResult
      }),
    },
  })
  const parent = createActor(
    setup({
      types: {} as {
        context: {deletionRef: ActorRefFromLogic<typeof deletion>}
        events: {type: 'deletion.activated'} | {type: 'deletion.deactivated'}
      },
    }).createMachine({
      context: ({spawn}) => ({deletionRef: spawn(deletion, {input: undefined})}),
      on: {'deletion.activated': {}, 'deletion.deactivated': {}},
    }),
  ).start()
  const actor = parent.getSnapshot().context.deletionRef
  const emitted: string[] = []
  actor.on('allVersionsDeleted', (event) => emitted.push(event.type))
  actor.send({
    type: 'versions.changed',
    versionIds: options?.versionIds ?? [PUBLISHED_ID, VARIANT_DRAFT_ID, DRAFT_ID, 'other'],
    variantIds: options?.variantIds ?? [],
  })
  actor.send({type: 'selection.changed', selectedIds: new Set(selectedIds)})
  actor.send({type: 'delete.request'})
  return {actor, parent, deleted, emitted}
}

const LINK: IncomingReference = {_id: 'homepage', _type: 'page'}
const DE_DE = '_.variants.de-DE'

describe('deletionMachine', () => {
  it('leaves links to the Content Lake: the Default can be confirmed once they are read', async () => {
    const {actor, parent, deleted} = start([LINK], [PUBLISHED_ID])
    await waitFor(actor, (snapshot) => snapshot.context.incomingReferencesChecked)

    expect(actor.getSnapshot().can({type: 'delete.confirm'})).toBe(true)
    expect(actor.getSnapshot().can({type: 'delete.confirmExcludingPublished'})).toBe(false)
    actor.send({type: 'delete.confirm'})
    await waitFor(actor, (snapshot) => snapshot.matches('idle'))

    expect(deleted).toEqual([[PUBLISHED_ID]])
    parent.stop()
  })

  it('never blocks deleting versions other than the Default', () => {
    const {actor, parent} = start([LINK], [VARIANT_DRAFT_ID], {variantIds: [DE_DE]})

    expect(actor.getSnapshot().can({type: 'delete.confirm'})).toBe(true)
    parent.stop()
  })

  it('blocks deleting the published Default while variants exist', async () => {
    const {actor, parent} = start([], [PUBLISHED_ID], {variantIds: [DE_DE]})
    await waitFor(actor, (snapshot) => snapshot.context.incomingReferencesChecked)

    expect(actor.getSnapshot().can({type: 'delete.confirm'})).toBe(false)
    // Only the Default is selected, so there is nothing else to delete instead.
    expect(actor.getSnapshot().can({type: 'delete.confirmExcludingPublished'})).toBe(false)
    parent.stop()
  })

  it('deletes the other selected versions and leaves the Default while variants exist', async () => {
    const {actor, parent, deleted} = start([], [PUBLISHED_ID, VARIANT_DRAFT_ID, DRAFT_ID], {
      variantIds: [DE_DE],
    })

    expect(actor.getSnapshot().can({type: 'delete.confirm'})).toBe(false)
    actor.send({type: 'delete.confirmExcludingPublished'})
    await waitFor(actor, (snapshot) => snapshot.matches('idle'))

    expect(deleted).toEqual([[VARIANT_DRAFT_ID, DRAFT_ID]])
    parent.stop()
  })

  it('keeps the Default blocked when deleting the others fails and is retried', async () => {
    const {actor, parent, deleted} = start([], [PUBLISHED_ID, VARIANT_DRAFT_ID], {
      failFirstDelete: true,
      variantIds: [DE_DE],
    })

    actor.send({type: 'delete.confirmExcludingPublished'})
    await waitFor(actor, (snapshot) => snapshot.matches({active: {deletion: 'error'}}))

    expect(actor.getSnapshot().can({type: 'delete.confirm'})).toBe(false)
    actor.send({type: 'delete.confirmExcludingPublished'})
    await waitFor(actor, (snapshot) => snapshot.matches('idle'))

    expect(deleted).toEqual([[VARIANT_DRAFT_ID], [VARIANT_DRAFT_ID]])
    parent.stop()
  })

  it('reports when a delete leaves the document with no versions', async () => {
    const {actor, parent, emitted} = start([], [PUBLISHED_ID, DRAFT_ID], {
      versionIds: [PUBLISHED_ID, DRAFT_ID],
    })
    await waitFor(actor, (snapshot) => snapshot.context.incomingReferencesChecked)

    actor.send({type: 'delete.confirm'})
    await waitFor(actor, (snapshot) => snapshot.matches('idle'))

    expect(emitted).toEqual(['allVersionsDeleted'])
    parent.stop()
  })

  it('does not report an empty document while versions remain', async () => {
    const {actor, parent, emitted} = start([], [PUBLISHED_ID, VARIANT_DRAFT_ID], {
      versionIds: [PUBLISHED_ID, VARIANT_DRAFT_ID],
      variantIds: [DE_DE],
    })

    // The Default is blocked by the variant, so only the variant goes and the Default remains.
    actor.send({type: 'delete.confirmExcludingPublished'})
    await waitFor(actor, (snapshot) => snapshot.matches('idle'))

    expect(emitted).toEqual([])
    parent.stop()
  })

  it('keeps the Default when the selection or versions change while the delete is in flight', async () => {
    const {actor, parent, emitted, deleted} = start([], [PUBLISHED_ID, VARIANT_DRAFT_ID], {
      versionIds: [PUBLISHED_ID, VARIANT_DRAFT_ID],
      variantIds: [DE_DE],
    })

    actor.send({type: 'delete.confirmExcludingPublished'})
    // A refresh mid-delete: the selection is re-sent and the variant is gone
    actor.send({type: 'selection.changed', selectedIds: new Set([PUBLISHED_ID, VARIANT_DRAFT_ID])})
    actor.send({type: 'versions.changed', versionIds: [PUBLISHED_ID], variantIds: []})
    await waitFor(actor, (snapshot) => snapshot.matches('idle'))

    expect(deleted).toEqual([[VARIANT_DRAFT_ID]])
    expect(emitted).toEqual([])
    parent.stop()
  })

  it('reports an emptied document when the live versions empty before the delete finishes', async () => {
    const {actor, parent, emitted} = start([], [PUBLISHED_ID, DRAFT_ID], {
      versionIds: [PUBLISHED_ID, DRAFT_ID],
    })
    await waitFor(actor, (snapshot) => snapshot.context.incomingReferencesChecked)

    actor.send({type: 'delete.confirm'})
    actor.send({type: 'versions.changed', versionIds: [], variantIds: []})
    await waitFor(actor, (snapshot) => snapshot.matches('idle'))

    expect(emitted).toEqual(['allVersionsDeleted'])
    parent.stop()
  })
})
