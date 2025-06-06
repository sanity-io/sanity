import {createClient, type SanityClient} from '@sanity/client'
import {uuid} from '@sanity/uuid'

import {readEnv} from './envVars'

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
  projectId: readEnv('SANITY_E2E_PROJECT_ID'),
  dataset: readEnv('SANITY_E2E_DATASET'),
  token: readEnv('SANITY_E2E_SESSION_TOKEN'),
  useCdn: false,
  apiVersion: '2021-08-31',
  apiHost: 'https://api.sanity.work',
})

/* eslint-disable callback-return*/
export function withDefaultClient(callback: (context: TestContext) => void): void {
  const context = new TestContext(testSanityClient)
  callback(context)

  context.teardown()
}
