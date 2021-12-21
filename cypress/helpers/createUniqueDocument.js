import {uuid} from '@sanity/uuid'
import testSanityClient from './sanityClientSetUp'

export async function createUniqueDocument({_type, _id, ...restProps}) {
  const doc = {
    _type,
    _id: _id || uuid(),
    ...restProps,
  }

  await testSanityClient.create(doc)

  return doc
}
