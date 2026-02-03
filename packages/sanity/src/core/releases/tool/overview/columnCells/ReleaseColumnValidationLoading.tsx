import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {useBundleDocuments} from '../../detail/useBundleDocuments'
import {ValidationProgressIndicator} from '../../detail/ValidationProgressIndicator'
import {Spinner} from '@sanity/ui'

export function ReleaseColumnValidationLoading({releaseId}: {releaseId: string}) {
  const rId = getReleaseIdFromReleaseDocumentId(releaseId)
  const {results: documents, loading} = useBundleDocuments(rId)

  return loading ? (
    <Spinner size={1} muted />
  ) : (
    <ValidationProgressIndicator layout="minimal" documents={documents} />
  )
}
