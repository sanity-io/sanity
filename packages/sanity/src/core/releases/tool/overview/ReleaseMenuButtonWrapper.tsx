import {type ReleaseDocument} from '@sanity/client'

import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {ReleaseMenuButton} from '../components/ReleaseMenuButton/ReleaseMenuButton'
import {useReleaseDocuments} from '../detail/useReleaseDocuments'

export const ReleaseMenuButtonWrapper = ({
  release,
  documentsCount,
}: {
  release: ReleaseDocument
  documentsCount: number
}) => {
  const {results: documents} = useReleaseDocuments(getReleaseIdFromReleaseDocumentId(release._id))

  return (
    <ReleaseMenuButton release={release} documentsCount={documentsCount} documents={documents} />
  )
}
