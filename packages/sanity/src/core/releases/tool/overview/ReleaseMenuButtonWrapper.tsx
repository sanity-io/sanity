import {type ReleaseDocument} from '../../store/types'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {ReleaseMenuButton} from '../components/ReleaseMenuButton/ReleaseMenuButton'
import {useBundleDocuments} from '../detail/useBundleDocuments'

export const ReleaseMenuButtonWrapper = ({
  release,
  documentsCount,
}: {
  release: ReleaseDocument
  documentsCount: number
}) => {
  const {results: documents} = useBundleDocuments(getReleaseIdFromReleaseDocumentId(release._id))

  return (
    <ReleaseMenuButton release={release} documentsCount={documentsCount} documents={documents} />
  )
}
