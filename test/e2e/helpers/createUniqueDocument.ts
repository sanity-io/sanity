import {SanityDocument, SanityDocumentStub} from '@sanity/client'
import {uuid} from '@sanity/uuid'
import {testSanityClient} from './sanityClient'

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
