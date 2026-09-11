import {type SanityClient} from '@sanity/client'
import {EMPTY, of} from 'rxjs'
import {describe, expect, it} from 'vitest'
import {createActor, fromObservable, waitFor} from 'xstate'

import {createMockSanityClient} from '../../../../test/mocks/mockSanityClient'
import {type TFunction} from '../../i18n/types'
import {createInventoryDeletionMachine} from './createInventoryDeletionMachine'
import {type ReferringDocuments} from './deletionMachine'
import {documentGroupInventoryMachine, type Meta} from './documentGroupInventoryMachine'
import {selectionMachine} from './selectionMachine'
import {variantCreationMachine} from './variantCreationMachine'

const noReferringDocuments = of<ReferringDocuments>({
  isLoading: false,
  totalCount: 0,
  projectIds: [],
  datasetNames: [],
  hasUnknownDatasetNames: false,
})

const t = ((key: string) => key) as unknown as TFunction

// Spawns the deletion machine under its real parent, because entering `active`
// sends to the parent and a parentless actor stops on that send.
function createInventoryActor(getDeletableIds: () => ReadonlySet<string>) {
  const client = createMockSanityClient()

  const inventoryRef = createActor(
    documentGroupInventoryMachine.provide({
      actors: {meta: fromObservable<Meta, unknown>(() => EMPTY)},
    }),
    {
      input: {
        selectionMachine,
        variantCreationMachine,
        deletionMachine: createInventoryDeletionMachine({
          client: client as unknown as SanityClient,
          referringDocuments$: noReferringDocuments,
          getDeletableIds,
        }),
        t,
        variantsEnabled: false,
      },
    },
  )

  inventoryRef.start()

  return {client, inventoryRef, deletionRef: inventoryRef.getSnapshot().context.deletionRef}
}

async function confirmDeletion(options: {selectedIds: string[]; deletableIds: string[]}) {
  const {client, inventoryRef, deletionRef} = createInventoryActor(
    () => new Set(options.deletableIds),
  )

  inventoryRef.send({type: 'selection.changed', selectedIds: new Set(options.selectedIds)})
  deletionRef.send({type: 'delete.request'})
  deletionRef.send({type: 'delete.confirm'})

  await waitFor(deletionRef, (snapshot) => snapshot.matches('idle'), {timeout: 5_000})

  return client
}

describe('createInventoryDeletionMachine', () => {
  it('deletes only the ids on the allowlist when the machine holds a wider selection', async () => {
    const client = await confirmDeletion({
      selectedIds: ['versions.summer.foo', 'drafts.foo'],
      deletableIds: ['drafts.foo'],
    })

    const [transaction] = client.$log.transaction
    expect(transaction.delete).toEqual([['drafts.foo']])
    expect(transaction.commit).toHaveLength(1)
    expect(transaction.commit[0][0]).toMatchObject({tag: 'document.delete'})
  })

  it('never opens a transaction when the selection and the allowlist are disjoint', async () => {
    const client = await confirmDeletion({
      selectedIds: ['versions.summer.foo'],
      deletableIds: ['drafts.foo'],
    })

    expect(client.$log.transaction).toEqual([])
  })

  it('deletes every selected id when all of them are on the allowlist', async () => {
    const client = await confirmDeletion({
      selectedIds: ['drafts.foo', 'versions.summer.foo'],
      deletableIds: ['drafts.foo', 'versions.summer.foo'],
    })

    const [transaction] = client.$log.transaction
    expect(transaction.delete).toEqual([['drafts.foo'], ['versions.summer.foo']])
    expect(transaction.commit).toHaveLength(1)
  })

  it('reads the allowlist on confirm, not when the machine is built', async () => {
    let deletableIds: ReadonlySet<string> = new Set()
    const {client, inventoryRef, deletionRef} = createInventoryActor(() => deletableIds)

    deletableIds = new Set(['drafts.foo'])
    inventoryRef.send({type: 'selection.changed', selectedIds: new Set(['drafts.foo'])})
    deletionRef.send({type: 'delete.request'})
    deletionRef.send({type: 'delete.confirm'})

    await waitFor(deletionRef, (snapshot) => snapshot.matches('idle'), {timeout: 5_000})

    const [transaction] = client.$log.transaction
    expect(transaction.delete).toEqual([['drafts.foo']])
  })
})
