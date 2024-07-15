import {type SanityDocument} from '@sanity/types'
import {Stack} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {type BundleDocument} from 'sanity'

import {type DocumentHistory} from './documentTable/useReleaseHistory'
import {DocumentDiff} from './review/DocumentDiff'

export function ReleaseReview({
  documents,
  release,
  documentsHistory,
}: {
  documents: SanityDocument[]
  release: BundleDocument
  documentsHistory: Map<string, DocumentHistory>
}) {
  return (
    <Stack space={[5, 6]}>
      {documents.map((document) => (
        <DocumentDiff
          key={document._id}
          document={document}
          release={release}
          history={documentsHistory.get(document._id)}
        />
      ))}
    </Stack>
  )
}
