import {type SanityDocument} from '@sanity/types'

export function* fromDocuments(documents: SanityDocument[]) {
  for (const document of documents) {
    yield document
  }
}
