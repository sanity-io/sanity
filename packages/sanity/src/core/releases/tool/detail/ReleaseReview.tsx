import {type SanityDocument} from '@sanity/types'
import {Stack} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {type BundleDocument} from 'sanity'

import {DocumentDiff} from './review/DocumentDiff'

export function ReleaseReview({
  documents,
  release,
}: {
  documents: SanityDocument[]
  release: BundleDocument
}) {
  return (
    <Stack space={[5, 6]}>
      {documents.map((document) => (
        <DocumentDiff key={document._id} document={document} release={release} />
      ))}
    </Stack>
  )
}
