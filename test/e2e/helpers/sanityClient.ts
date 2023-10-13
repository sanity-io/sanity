import {createClient} from '@sanity/client'
import {SanityClient} from 'sanity'
import {SANITY_E2E_SESSION_TOKEN} from '../env'
import {STUDIO_DATASET_NAME, STUDIO_PROJECT_ID} from './constants'
import {uuid} from '@sanity/uuid'

export class TestContext {
  client: SanityClient

  constructor(client: SanityClient) {
    this.client = client
  }

  documentIds = new Set<string>()

  getUniqueDocumentId() {
    const documentId = uuid()
    this.documentIds.add(documentId)
    return documentId
  }

  teardown() {
    this.client.delete({
      query: '*[_id in $ids]',
      params: {ids: [...this.documentIds].map((id) => `drafts.${id}`)},
    })
  }
}

const testSanityClient = createClient({
  projectId: STUDIO_PROJECT_ID,
  dataset: STUDIO_DATASET_NAME,
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
