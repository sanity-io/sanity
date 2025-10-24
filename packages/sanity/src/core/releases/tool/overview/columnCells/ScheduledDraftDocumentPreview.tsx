import {Box, Flex, Skeleton} from '@sanity/ui'

import {useScheduledDraftDocument} from '../../../../singleDocRelease/hooks/useScheduledDraftDocument'
import {ReleaseDocumentPreview} from '../../components/ReleaseDocumentPreview'
import {type VisibleColumn} from '../../components/Table/types'
import {type TableRelease} from '../ReleasesOverview'

export const ScheduledDraftDocumentPreview: VisibleColumn<TableRelease>['cell'] = ({
  datum: release,
  cellProps,
}) => {
  const {firstDocument, loading: documentsLoading} = useScheduledDraftDocument(
    release._id && !release.isLoading ? release._id : undefined,
  )

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
