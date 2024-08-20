import {type SanityDocument} from '@sanity/types'
import {Stack} from '@sanity/ui'

import {type BundleDocument} from '../../../store/bundles/types'
import {type DocumentHistory} from './documentTable/useReleaseHistory'
import {DocumentDiffContainer} from './review/DocumentDiffContainer'

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
        <DocumentDiffContainer
          key={document._id}
          document={document}
          release={release}
          history={documentsHistory.get(document._id)}
        />
      ))}
    </Stack>
  )
}
