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
function start(references: IncomingReference[], selectedIds: string[]) {
  const deleted: string[][] = []
  const deletion = deletionMachine.provide({
    actors: {
      referringDocuments: fromObservable(() => new BehaviorSubject(referringDocuments(references))),
      deleteVariants: fromPromise(async ({input}) => {
        deleted.push(input.ids)
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
  actor.send({type: 'selection.changed', selectedIds: new Set(selectedIds)})
  actor.send({type: 'delete.request'})
  return {actor, parent, deleted}
}

const REQUIRED: IncomingReference = {_id: 'homepage', _type: 'page', required: true}
const OPTIONAL: IncomingReference = {_id: 'gift-guide', _type: 'page', required: false}

describe('deletionMachine', () => {
  it('blocks deleting the published Default while required links point at it', async () => {
    const {actor, parent} = start([REQUIRED, OPTIONAL], [PUBLISHED_ID])
    await waitFor(actor, (snapshot) => snapshot.context.incomingReferencesChecked)

    expect(actor.getSnapshot().can({type: 'delete.confirm'})).toBe(false)
    // Only the Default is selected, so there is nothing else to delete instead.
    expect(actor.getSnapshot().can({type: 'delete.confirmExcludingPublished'})).toBe(false)
    parent.stop()
  })

  it('deletes the other selected versions and leaves the blocked Default', async () => {
    const {actor, parent, deleted} = start([REQUIRED], [PUBLISHED_ID, VARIANT_DRAFT_ID, DRAFT_ID])
    await waitFor(actor, (snapshot) => snapshot.context.incomingReferencesChecked)

    expect(actor.getSnapshot().can({type: 'delete.confirm'})).toBe(false)
    actor.send({type: 'delete.confirmExcludingPublished'})
    await waitFor(actor, (snapshot) => snapshot.matches('idle'))

    expect(deleted).toEqual([[VARIANT_DRAFT_ID, DRAFT_ID]])
    parent.stop()
  })

  it('allows deleting the Default when only optional links point at it', async () => {
    const {actor, parent, deleted} = start([OPTIONAL], [PUBLISHED_ID])
    await waitFor(actor, (snapshot) => snapshot.context.incomingReferencesChecked)

    expect(actor.getSnapshot().can({type: 'delete.confirm'})).toBe(true)
    expect(actor.getSnapshot().can({type: 'delete.confirmExcludingPublished'})).toBe(false)
    actor.send({type: 'delete.confirm'})
    await waitFor(actor, (snapshot) => snapshot.matches('idle'))

    expect(deleted).toEqual([[PUBLISHED_ID]])
    parent.stop()
  })

  it('allows deleting the Default when the strength of its links is unknown, as before', async () => {
    const {actor, parent} = start([{_id: 'homepage', _type: 'page'}], [PUBLISHED_ID])
    await waitFor(actor, (snapshot) => snapshot.context.incomingReferencesChecked)

    expect(actor.getSnapshot().can({type: 'delete.confirm'})).toBe(true)
    parent.stop()
  })

  it('never blocks deleting versions other than the Default', async () => {
    const {actor, parent} = start([REQUIRED], [VARIANT_DRAFT_ID])

    expect(actor.getSnapshot().can({type: 'delete.confirm'})).toBe(true)
    parent.stop()
  })
})
