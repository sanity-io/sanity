import {Box, Flex, Skeleton} from '@sanity/ui'

import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {ReleaseDocumentPreview} from '../../components/ReleaseDocumentPreview'
import {type VisibleColumn} from '../../components/Table/types'
import {useBundleDocuments} from '../../detail/useBundleDocuments'
import {type TableRelease} from '../ReleasesOverview'

export const ScheduledDraftDocumentPreview: VisibleColumn<TableRelease>['cell'] = ({
  datum: release,
  cellProps,
}) => {
  const releaseId =
    release._id && !release.isLoading ? getReleaseIdFromReleaseDocumentId(release._id) : ''
  const {results: documents, loading: documentsLoading} = useBundleDocuments(releaseId)

  // TODO: Handle cases where there might be multiple documents WRONGLY in the release
  const firstDocument = documents?.[0]?.document

  const isLoading = release.isLoading || documentsLoading || !firstDocument

  if (isLoading) {
    return (
      <Flex {...cellProps} align="center" paddingX={2} paddingY={3} sizing="border">
        <Skeleton animated radius={2} style={{height: '32px', width: '100%'}} />
      </Flex>
    )
  }

  return (
    <Box {...cellProps} flex={1} padding={1} paddingLeft={2} paddingRight={2} sizing="border">
      <ReleaseDocumentPreview
        documentId={firstDocument._id}
        documentTypeName={firstDocument._type}
        releaseId={release._id}
        releaseState={release.state}
        documentRevision={firstDocument._rev}
        layout="default"
      />
    </Box>
  )
}
