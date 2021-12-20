import {uuid} from '@sanity/uuid'
import testSanityClient from './sanityClientSetUp'

export async function createUniqueDocument({_type, ...restProps}) {
  const doc = {
    _type,
    ...restProps,
  }

  if (!doc?._id) {
    doc._id = uuid()
  }

  await testSanityClient.createOrReplace(doc)

  return doc
}
