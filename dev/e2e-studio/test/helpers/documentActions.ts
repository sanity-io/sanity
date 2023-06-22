import {SanityDocument, SanityDocumentStub} from '@sanity/client'
import {uuid} from '@sanity/uuid'
import {STALE_TEST_THRESHOLD_MS} from './constants'
import {testSanityClient} from './sanityClient'

// Helper to generate path to document created in a test
export const generateDocumentUri = (path: string, docId: string): string => `desk/${path};${docId}`

export async function createUniqueDocument({
  _type,
  _id,
  ...restProps
}: SanityDocumentStub): Promise<Partial<SanityDocument>> {
  const doc = {
    _type,
    _id: _id || uuid(),
    ...restProps,
  }

  await testSanityClient.create(doc, {visibility: 'async'})
  return doc
}

export function deleteDocumentsForRun(
  typeName: string,
  runId: string
): {query: string; params: Record<string, unknown>} {
  const threshold = new Date(Date.now() - STALE_TEST_THRESHOLD_MS).toISOString()
  return {
    query: `*[_type == $typeName && (runId == $runId || _createdAt < "${threshold}")]`,
    params: {typeName, runId},
  }
}

export async function deleteSingleDocument(docId: string): Promise<SanityDocument> {
  const deletedDoc = await testSanityClient.delete(docId, {visibility: 'async'})
  return deletedDoc
}
