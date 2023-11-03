import {createClient} from '@sanity/client'
import {uuid} from '@sanity/uuid'
import {SANITY_E2E_SESSION_TOKEN, SANITY_E2E_DATASET, SANITY_E2E_PROJECT_ID} from '../env'
import {SanityClient} from 'sanity'

export class TestContext {
  client: SanityClient

  constructor(client: SanityClient) {
    this.client = client
  }

  documentIds = new Set<string>()

  getUniqueDocumentId(): string {
    const documentId = uuid()
    this.documentIds.add(documentId)
    return documentId
  }

  teardown(): void {
    this.client.delete({
      query: '*[_id in $ids]',
      params: {ids: [...this.documentIds].map((id) => `drafts.${id}`)},
    })
  }
}

const testSanityClient = createClient({
  projectId: SANITY_E2E_PROJECT_ID,
  dataset: SANITY_E2E_DATASET,
  token: SANITY_E2E_SESSION_TOKEN,
  useCdn: false,
  apiVersion: '2021-08-31',
})

/* eslint-disable callback-return*/
export function withDefaultClient(callback: (context: TestContext) => void): void {
  const context = new TestContext(testSanityClient)
  callback(context)

  context.teardown()
}
