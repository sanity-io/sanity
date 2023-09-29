import {SanityClient, SanityDocument, SanityDocumentStub} from '@sanity/client'
import {uuid} from '@sanity/uuid'

export async function createUniqueDocument(
  client: SanityClient,
  {_type, _id, ...restProps}: SanityDocumentStub,
): Promise<Partial<SanityDocument>> {
  const doc = {
    _type,
    _id: _id || uuid(),
    ...restProps,
  }

  await client.create(doc, {visibility: 'async'})
  return doc
}
