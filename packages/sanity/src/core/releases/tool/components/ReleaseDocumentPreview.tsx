import {type ReleaseState} from '@sanity/client'
import {Card} from '@sanity/ui'
import {useMemo} from 'react'
import {IntentLink} from 'sanity/router'

import {type PreviewLayoutKey} from '../../../components/previews/types'
import {DocumentPreviewPresence} from '../../../presence'
import {SanityDefaultPreview} from '../../../preview/components/SanityDefaultPreview'
import {useDocumentPresence} from '../../../store/_legacy/presence/useDocumentPresence'
import {useDocumentPreviewValues} from '../../../tasks/hooks/useDocumentPreviewValues'
import {getPublishedId} from '../../../util/draftUtils'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'

interface ReleaseDocumentPreviewProps {
  documentId: string
  documentTypeName: string
  releaseId: string
  releaseState?: ReleaseState
  documentRevision?: string
  hasValidationError?: boolean
  layout?: PreviewLayoutKey
  isGoingToBePublished?: boolean
}

const isArchivedRelease = (releaseState: ReleaseState | undefined) =>
  releaseState === 'archived' || releaseState === 'archiving' || releaseState === 'unarchiving'

export function ReleaseDocumentPreview({
  documentId,
  documentTypeName,
  releaseId,
  releaseState,
  documentRevision,
  layout,
  isGoingToBePublished = false,
}: ReleaseDocumentPreviewProps) {
  const documentPresence = useDocumentPresence(documentId)

  const intentParams = useMemo(() => {
    if (releaseState === 'published') {
      // We are inspecting this document through the published view of the doc.
      return {
        rev: `@release:${getReleaseIdFromReleaseDocumentId(releaseId)}`,
        inspect: 'sanity/structure/history',
      }
    }

    if (releaseState === 'archived') {
      // We are "faking" the release as if it is still valid only to render the document
      return {
        rev: '@lastEdited',
        inspect: 'sanity/structure/history',
        historyEvent: documentRevision,
        historyVersion: getReleaseIdFromReleaseDocumentId(releaseId),
        archivedRelease: 'true',
      }
    }

    return {}
  }, [releaseState, releaseId, documentRevision])

  const previewPresence = useMemo(
    () => documentPresence?.length > 0 && <DocumentPreviewPresence presence={documentPresence} />,
    [documentPresence],
  )

  const {isLoading: previewLoading, value: resolvedPreview} = useDocumentPreviewValues({
    documentId: isGoingToBePublished ? getPublishedId(documentId) : documentId,
    documentType: documentTypeName,
    perspectiveStack: isGoingToBePublished ? [] : [getReleaseIdFromReleaseDocumentId(releaseId)],
  })

  return (
    <Card
      tone="inherit"
      as={IntentLink}
      radius={2}
      data-as="a"
      intent="edit"
      params={{
        id: getPublishedId(documentId),
        type: documentTypeName,
        ...intentParams,
      }}
      searchParams={
        isArchivedRelease(releaseState)
          ? undefined
          : [
              [
                'perspective',
                releaseState === 'published'
                  ? 'published'
                  : getReleaseIdFromReleaseDocumentId(releaseId),
              ],
            ]
      }
    >
      <SanityDefaultPreview
        {...(resolvedPreview || {})}
        status={previewPresence}
        isPlaceholder={previewLoading}
        layout={layout}
      />
    </Card>
  )
}
