import {Spinner} from 'ui5'

import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {useReleaseDocuments} from '../../detail/useReleaseDocuments'
import {ValidationProgressIndicator} from '../../detail/ValidationProgressIndicator'

export function ReleaseColumnValidationLoading({releaseId}: {releaseId: string}) {
  const rId = getReleaseIdFromReleaseDocumentId(releaseId)
  const {results: documents, loading} = useReleaseDocuments(rId)

  return loading ? (
    <Spinner
      size={1}
      style={{
        color: 'var(--foreground-low)',
      }}
    />
  ) : (
    <ValidationProgressIndicator layout="minimal" documents={documents} />
  )
}
