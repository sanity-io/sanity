import {Flex, Skeleton, Stack} from '@sanity/ui'

import {PREVIEW_SIZES} from '../../../../components/previews/constants'
import {TitleSkeleton} from '../../../../components/previews/general/DetailPreview.styled'
import {useScheduledDraftDocument} from '../../../../singleDocRelease/hooks/useScheduledDraftDocument'
import {ReleaseDocumentPreviewContent} from '../../components/ReleaseDocumentPreview'
import {type TableRelease} from '../ReleasesOverview'

/**
 * Renders the document thumbnail + title for a cardinality-one release (a
 * scheduled draft / single-document release), in place of the release
 * avatar + title used for cardinality-many releases (bundles).
 *
 * Calls {@link useScheduledDraftDocument} unconditionally, so it must only be
 * mounted (not just conditionally rendered inline) when the row is known to
 * be a cardinality-one release — see `ReleaseNameCell`.
 *
 * @internal
 */
export function ReleaseDocumentNameContent({release}: {release: TableRelease}) {
  const {firstDocument, loading: documentsLoading} = useScheduledDraftDocument(release._id)

  const isLoading = documentsLoading || !firstDocument

  if (isLoading) {
    return (
      <Flex align="center" gap={2} flex={1}>
        <Skeleton animated radius={1} style={PREVIEW_SIZES.default.media} />
        <TitleSkeleton />
      </Flex>
    )
  }

  return (
    <Stack flex={1} style={{minWidth: 0}}>
      <ReleaseDocumentPreviewContent
        documentId={firstDocument._id}
        documentTypeName={firstDocument._type}
        releaseId={release._id}
        layout="default"
      />
    </Stack>
  )
}
