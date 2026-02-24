import {type SanityClient, createClient} from '@sanity/client'
import {
  type TransactionLogEventWithEffects,
  type TransactionLogEventWithMutations,
} from '@sanity/types'
import {firstValueFrom, map, toArray} from 'rxjs'
import {describe, expect, it as baseIt} from 'vitest'

import {type getTransactionsLogs} from '../store/translog/getTransactionsLogs'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../studioClient'
import {transactionFixtures} from './fixtures/transactions'
import {
  readTransactionsFollowingLineage,
  readMostRecentSharedTransaction,
} from './readMostRecentSharedTransaction'

const it = baseIt.extend<{
  getTransactionsLogs: typeof getTransactionsLogs
  client: SanityClient
}>({
  // oxlint-disable-next-line no-empty-pattern
  getTransactionsLogs: async ({}, consume) => {
    await consume(createStaticTransactionsReader(transactionFixtures))
  },
  // oxlint-disable-next-line no-empty-pattern
  client: async ({}, consume) => {
    await consume(
      createClient({
        ...DEFAULT_STUDIO_CLIENT_OPTIONS,
        projectId: 'x',
      }),
    )
  },
})

describe('readMostRecentSharedTransaction', () => {
  it('emits the most recent transaction shared by documents a and b', async ({
    getTransactionsLogs,
    client,
  }) => {
    const a = await firstValueFrom(
      readMostRecentSharedTransaction({
        a: '52a3fda5-42bd-4b6e-916a-397659504278',
        b: 'versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278',
        client,
        getTransactionsLogs,
      }).pipe(
        map(
          (transaction) =>
            `${transaction?.timestamp} - ${transaction?.documentIDs[0]} @ ${transaction?.id}`,
        ),
      ),
    )

    expect(a).toMatchInlineSnapshot(
      `"2026-02-10T15:45:22.175034Z - 52a3fda5-42bd-4b6e-916a-397659504278 @ hEhBGCJZp4u4KyFsZ7myth"`,
    )

    const b = await firstValueFrom(
      readMostRecentSharedTransaction({
        a: 'versions.r89zKf6wh.007f7c5a-cde0-47dc-8fd2-8c9b676767e5',
        b: 'versions.rPDS1lZw9.007f7c5a-cde0-47dc-8fd2-8c9b676767e5',
        client,
        getTransactionsLogs,
      }).pipe(
        map(
          (transaction) =>
            `${transaction?.timestamp} - ${transaction?.documentIDs[0]} @ ${transaction?.id}`,
        ),
      ),
    )

    expect(b).toMatchInlineSnapshot(
      `"2026-01-13T14:30:04.294899Z - versions.rRZXwJcXP.007f7c5a-cde0-47dc-8fd2-8c9b676767e5 @ kOryaFwDALwIJUryj1BN4C"`,
    )
  })

  it('emits nothing if documents a and b have no shared lineage', async ({
    getTransactionsLogs,
    client,
  }) => {
    const a = await firstValueFrom(
      readMostRecentSharedTransaction({
        a: '52a3fda5-42bd-4b6e-916a-397659504278',
        b: '97eff14b-7f35-4282-8a9d-fc9950f59425',
        client,
        getTransactionsLogs,
      }),
    )

    expect(a).toBeUndefined()
  })
})

describe('readTransactionsFollowingLineage', () => {
  it('emits transactions in timestamp descending order, following all `_system.base` links', async ({
    getTransactionsLogs,
    client,
  }) => {
    const a = await firstValueFrom(
      readTransactionsFollowingLineage({
        documentId: '52a3fda5-42bd-4b6e-916a-397659504278',
        client,
        getTransactionsLogs,
      }).pipe(
        map(
          (transaction) =>
            `${transaction.timestamp} - ${transaction.documentIDs[0]} @ ${transaction.id}`,
        ),
        toArray(),
      ),
    )

    expect(a).toMatchInlineSnapshot(`
    [
      "2026-02-24T10:51:30.248850Z - 52a3fda5-42bd-4b6e-916a-397659504278 @ ANmjHVVgDTTrKdU5YherOz",
      "2026-02-10T15:46:29.290062Z - 52a3fda5-42bd-4b6e-916a-397659504278 @ MEqVgzostb8bllee6V2Gnl",
      "2026-02-10T15:45:22.175034Z - 52a3fda5-42bd-4b6e-916a-397659504278 @ hEhBGCJZp4u4KyFsZ7myth",
      "2026-02-07T15:45:53.526766Z - 52a3fda5-42bd-4b6e-916a-397659504278 @ 8QGtOBd2tQypqqySDcAakK",
      "2026-02-07T15:44:58.172735Z - 52a3fda5-42bd-4b6e-916a-397659504278 @ joBYofTHE7ZKVsLAXRL1q2",
      "2026-02-07T15:44:40.838069Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ 6e323412-933b-46a5-bfa1-198a41274375",
      "2026-02-07T15:44:36.128498Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ e7a502d4-1fe9-48dc-8c76-44136518daf3",
      "2026-02-07T15:44:35.127436Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ 80b369b0-4e3d-4507-864c-db29a7b0b841",
      "2026-02-07T15:44:26.227538Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ bc6bcd40-c725-4f58-b7a1-a44a977cdc4a",
      "2026-02-07T15:44:25.088300Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ f7866881-df16-48e9-92ca-960828cf64b3",
      "2026-02-07T15:43:42.828615Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ d28d84b1-5cc6-4bfd-86fe-474ca9015cd8",
      "2026-02-07T15:43:41.780364Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ 28088657-1d0d-4b28-9bf3-31fdb698a841",
      "2026-02-07T15:43:40.773850Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ b93d00c7-16f3-4854-b0e3-6fd955e4781d",
      "2026-02-07T15:43:39.775942Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ aafaabd3-18a0-4123-921d-e57991ea5697",
    ]
  `)

    const b = await firstValueFrom(
      readTransactionsFollowingLineage({
        documentId: 'versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278',
        client,
        getTransactionsLogs,
      }).pipe(
        map(
          (transaction) =>
            `${transaction.timestamp} - ${transaction.documentIDs[0]} @ ${transaction.id}`,
        ),
        toArray(),
      ),
    )

    expect(b).toMatchInlineSnapshot(`
    [
      "2026-02-18T15:27:04.822613Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ 2cff736b-399d-44bb-af2e-2377a69f9238",
      "2026-02-18T15:27:03.533607Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ 4ca4eec3-abf6-4320-993e-36dafae2469c",
      "2026-02-18T15:08:33.715418Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ 921c71d2-745c-4f84-bc3e-0c37b85ac8a2",
      "2026-02-16T15:43:08.571400Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ 92d75758-86d4-4d1d-88b7-67f2d89783e6",
      "2026-02-16T15:28:31.621397Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ 57991c11-f341-48ea-b33b-bde38ef1fcea",
      "2026-02-16T15:23:34.733983Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ 3299c302-69c0-4e33-9a88-14fc12fafdd5",
      "2026-02-16T15:23:33.522169Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ d41e3462-994d-4e31-bb39-7b793ffb2d31",
      "2026-02-16T15:14:59.339012Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ 008240f7-0e71-436a-8651-bde192bca485",
      "2026-02-16T12:42:28.689124Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ fee50baf-7f76-4dd6-b6cd-ce57bb38390e",
      "2026-02-16T12:42:25.056539Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ d11bc7ef-59e7-455e-9a1b-86e7d5ad99de",
      "2026-02-16T12:42:24.017988Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ f4e2c2b5-04b6-4fa2-8afe-ac4f123fb032",
      "2026-02-16T12:42:22.794985Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ 30ff78de-3dd7-4790-a112-1d3acd8d5d6e",
      "2026-02-16T12:42:21.562084Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ cc72e491-b4b2-4422-ab3f-82f0fbb9f148",
      "2026-02-16T12:41:09.759112Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ 015469ff-0e67-4fa4-b75d-c74382167c00",
      "2026-02-16T12:41:08.665173Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ 6bba94e1-37df-4024-8a2a-1346b26adc21",
      "2026-02-12T20:35:53.094579Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ b2100535-328c-4de0-a20d-9821ad27e6c0",
      "2026-02-10T15:45:38.453434Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ MEqVgzostb8bllee6V18gj",
      "2026-02-10T15:45:22.175034Z - 52a3fda5-42bd-4b6e-916a-397659504278 @ hEhBGCJZp4u4KyFsZ7myth",
      "2026-02-07T15:45:53.526766Z - 52a3fda5-42bd-4b6e-916a-397659504278 @ 8QGtOBd2tQypqqySDcAakK",
      "2026-02-07T15:44:58.172735Z - 52a3fda5-42bd-4b6e-916a-397659504278 @ joBYofTHE7ZKVsLAXRL1q2",
      "2026-02-07T15:44:40.838069Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ 6e323412-933b-46a5-bfa1-198a41274375",
      "2026-02-07T15:44:36.128498Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ e7a502d4-1fe9-48dc-8c76-44136518daf3",
      "2026-02-07T15:44:35.127436Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ 80b369b0-4e3d-4507-864c-db29a7b0b841",
      "2026-02-07T15:44:26.227538Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ bc6bcd40-c725-4f58-b7a1-a44a977cdc4a",
      "2026-02-07T15:44:25.088300Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ f7866881-df16-48e9-92ca-960828cf64b3",
      "2026-02-07T15:43:42.828615Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ d28d84b1-5cc6-4bfd-86fe-474ca9015cd8",
      "2026-02-07T15:43:41.780364Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ 28088657-1d0d-4b28-9bf3-31fdb698a841",
      "2026-02-07T15:43:40.773850Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ b93d00c7-16f3-4854-b0e3-6fd955e4781d",
      "2026-02-07T15:43:39.775942Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ aafaabd3-18a0-4123-921d-e57991ea5697",
      "2026-02-10T15:43:21.725299Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ hEhBGCJZp4u4KyFsZ7msZl",
      "2026-02-07T15:45:11.978507Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ 5a6b060c-4f2e-4479-b0e5-ba539df4c3ce",
      "2026-02-07T15:45:10.975301Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ 52ed565c-089e-4502-b28e-29a4b18eccc7",
      "2026-02-07T15:45:09.536154Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ 7a6235b1-d17f-496d-8921-e2db0ed4f47b",
      "2026-02-07T15:45:08.476925Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ 2e4e931d-f040-42ab-962b-4fddc73e06ec",
      "2026-02-07T15:45:04.335609Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ joBYofTHE7ZKVsLAXRL2n4",
      "2026-02-07T15:44:58.172735Z - 52a3fda5-42bd-4b6e-916a-397659504278 @ joBYofTHE7ZKVsLAXRL1q2",
      "2026-02-07T15:44:40.838069Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ 6e323412-933b-46a5-bfa1-198a41274375",
      "2026-02-07T15:44:36.128498Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ e7a502d4-1fe9-48dc-8c76-44136518daf3",
      "2026-02-07T15:44:35.127436Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ 80b369b0-4e3d-4507-864c-db29a7b0b841",
      "2026-02-07T15:44:26.227538Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ bc6bcd40-c725-4f58-b7a1-a44a977cdc4a",
      "2026-02-07T15:44:25.088300Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ f7866881-df16-48e9-92ca-960828cf64b3",
      "2026-02-07T15:43:42.828615Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ d28d84b1-5cc6-4bfd-86fe-474ca9015cd8",
      "2026-02-07T15:43:41.780364Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ 28088657-1d0d-4b28-9bf3-31fdb698a841",
      "2026-02-07T15:43:40.773850Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ b93d00c7-16f3-4854-b0e3-6fd955e4781d",
      "2026-02-07T15:43:39.775942Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ aafaabd3-18a0-4123-921d-e57991ea5697",
      "2026-02-07T15:44:56.617903Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ JCaPlgqVAp2UVN8ea6ozkI",
      "2026-02-07T15:44:40.838069Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ 6e323412-933b-46a5-bfa1-198a41274375",
      "2026-02-07T15:44:36.128498Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ e7a502d4-1fe9-48dc-8c76-44136518daf3",
      "2026-02-07T15:44:35.127436Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ 80b369b0-4e3d-4507-864c-db29a7b0b841",
      "2026-02-07T15:44:26.227538Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ bc6bcd40-c725-4f58-b7a1-a44a977cdc4a",
      "2026-02-07T15:44:25.088300Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ f7866881-df16-48e9-92ca-960828cf64b3",
      "2026-02-07T15:43:42.828615Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ d28d84b1-5cc6-4bfd-86fe-474ca9015cd8",
      "2026-02-07T15:43:41.780364Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ 28088657-1d0d-4b28-9bf3-31fdb698a841",
      "2026-02-07T15:43:40.773850Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ b93d00c7-16f3-4854-b0e3-6fd955e4781d",
      "2026-02-07T15:43:39.775942Z - versions.rjOthGRpu.52a3fda5-42bd-4b6e-916a-397659504278 @ aafaabd3-18a0-4123-921d-e57991ea5697",
    ]
  `)

    const c = await firstValueFrom(
      readTransactionsFollowingLineage({
        documentId: 'versions.r89zKf6wh.007f7c5a-cde0-47dc-8fd2-8c9b676767e5',
        client,
        getTransactionsLogs,
      }).pipe(
        map(
          (transaction) =>
            `${transaction.timestamp} - ${transaction.documentIDs[0]} @ ${transaction.id}`,
        ),
        toArray(),
      ),
    )

    expect(c).toMatchInlineSnapshot(`
    [
      "2026-02-25T14:39:29.917788Z - versions.r89zKf6wh.007f7c5a-cde0-47dc-8fd2-8c9b676767e5 @ 1303a8c0-1dbf-4298-9b64-8bf363bcae07",
      "2026-02-25T14:39:28.949699Z - versions.r89zKf6wh.007f7c5a-cde0-47dc-8fd2-8c9b676767e5 @ fdddc6c6-4c4b-4f66-a838-afdaf8d79da1",
      "2026-02-25T14:08:36.599409Z - versions.r89zKf6wh.007f7c5a-cde0-47dc-8fd2-8c9b676767e5 @ QdBzkfVnOIlQhQTBlC9Dr0",
      "2026-01-13T14:30:04.294899Z - versions.rRZXwJcXP.007f7c5a-cde0-47dc-8fd2-8c9b676767e5 @ kOryaFwDALwIJUryj1BN4C",
      "2026-01-13T14:00:00.891080Z - 007f7c5a-cde0-47dc-8fd2-8c9b676767e5 @ sZ3ks4NEMKxsuquwNVxs61",
      "2026-01-12T13:27:38.210361Z - 007f7c5a-cde0-47dc-8fd2-8c9b676767e5 @ 75M4DWmhNOIDm3826F90tV",
    ]
  `)

    const d = await firstValueFrom(
      readTransactionsFollowingLineage({
        documentId: 'versions.rPDS1lZw9.007f7c5a-cde0-47dc-8fd2-8c9b676767e5',
        client,
        getTransactionsLogs,
      }).pipe(
        map(
          (transaction) =>
            `${transaction.timestamp} - ${transaction.documentIDs[0]} @ ${transaction.id}`,
        ),
        toArray(),
      ),
    )

    expect(d).toMatchInlineSnapshot(`
    [
      "2026-02-25T14:08:47.067770Z - versions.rPDS1lZw9.007f7c5a-cde0-47dc-8fd2-8c9b676767e5 @ nA3Vh0LF3MMCmtPLRTAlat",
      "2026-01-13T14:30:04.294899Z - versions.rRZXwJcXP.007f7c5a-cde0-47dc-8fd2-8c9b676767e5 @ kOryaFwDALwIJUryj1BN4C",
      "2026-01-13T14:00:00.891080Z - 007f7c5a-cde0-47dc-8fd2-8c9b676767e5 @ sZ3ks4NEMKxsuquwNVxs61",
      "2026-01-12T13:27:38.210361Z - 007f7c5a-cde0-47dc-8fd2-8c9b676767e5 @ 75M4DWmhNOIDm3826F90tV",
    ]
  `)
  })
})

const createStaticTransactionsReader: (transactions: any) => typeof getTransactionsLogs = (
  transactions,
) => {
  return (_, documentId, options) => {
    if (Array.isArray(documentId)) {
      throw new Error('Reading multiple documents not implemented.')
    }

    if (!options.reverse) {
      throw new Error('Non-reverse fetching not implemented.')
    }

    if (options.effectFormat !== 'mendoza') {
      throw new Error('Non-Mendoza fetching not implemented.')
    }

    if (!options.includeIdentifiedDocumentsOnly) {
      throw new Error('Non-indentified document fetching not implemented.')
    }

    if (!options.excludeContent) {
      throw new Error('Non-exclude content fetching not implemented.')
    }

    let documentTransactions = transactions[documentId] as (TransactionLogEventWithEffects &
      TransactionLogEventWithMutations)[]

    if (typeof documentTransactions === 'undefined') {
      throw new Error(`No fixtures for \`${documentId}\`.`)
    }

    if (typeof options.toTransaction !== 'undefined') {
      const toIndex = documentTransactions.findIndex(({id}) => id === options.toTransaction)
      documentTransactions = documentTransactions.slice(toIndex)
    }

    if (typeof options.limit !== 'undefined') {
      documentTransactions = documentTransactions.slice(0, options.limit)
    }

    return Promise.resolve(documentTransactions)
  }
}
