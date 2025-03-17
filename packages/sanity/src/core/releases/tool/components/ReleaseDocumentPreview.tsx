import {type PreviewValue} from '@sanity/types'
import {Card} from '@sanity/ui'
import {type ForwardedRef, forwardRef, useMemo} from 'react'
import {IntentLink} from 'sanity/router'

import {type PreviewLayoutKey} from '../../../components/previews/types'
import {DocumentPreviewPresence} from '../../../presence'
import {SanityDefaultPreview} from '../../../preview/components/SanityDefaultPreview'
import {useDocumentPresence} from '../../../store/_legacy/presence/useDocumentPresence'
import {getPublishedId} from '../../../util/draftUtils'
import {type ReleaseState} from '../../store/types'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'

interface ReleaseDocumentPreviewProps {
  documentId: string
  documentTypeName: string
  releaseId: string
  previewValues: PreviewValue | undefined | null
  isLoading: boolean
  releaseState?: ReleaseState
  documentRevision?: string
  hasValidationError?: boolean
  layout?: PreviewLayoutKey
}

const isArchivedRelease = (releaseState: ReleaseState | undefined) =>
  releaseState === 'archived' || releaseState === 'archiving' || releaseState === 'unarchiving'

export function ReleaseDocumentPreview({
  documentId,
  documentTypeName,
  releaseId,
  previewValues,
  isLoading,
  releaseState,
  documentRevision,
  layout,
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

  const LinkComponent = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      forwardRef(function LinkComponent(linkProps, ref: ForwardedRef<HTMLAnchorElement>) {
        return (
          <IntentLink
            {...linkProps}
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
            ref={ref}
          />
        )
      }),
    [documentId, documentTypeName, intentParams, releaseState, releaseId],
  )

  const previewPresence = useMemo(
    () => documentPresence?.length > 0 && <DocumentPreviewPresence presence={documentPresence} />,
    [documentPresence],
  )

  return (
    <Card tone="inherit" as={LinkComponent} radius={2} data-as="a">
      <SanityDefaultPreview
        {...previewValues}
        status={previewPresence}
        isPlaceholder={isLoading}
        layout={layout}
      />
    </Card>
  )
}
