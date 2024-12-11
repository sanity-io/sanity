import {type PreviewValue} from '@sanity/types'
import {Card} from '@sanity/ui'
import {type ForwardedRef, forwardRef, useMemo} from 'react'
import {IntentLink} from 'sanity/router'

import {DocumentPreviewPresence} from '../../../presence'
import {SanityDefaultPreview} from '../../../preview/components/SanityDefaultPreview'
import {getPublishedId} from '../../../util/draftUtils'
import {type ReleaseState, useDocumentPresence} from '../../index'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'

interface ReleaseDocumentPreviewProps {
  documentId: string
  documentTypeName: string
  releaseId: string
  previewValues: PreviewValue
  isLoading: boolean
  releaseState?: ReleaseState
  documentRevision?: string
}

export function ReleaseDocumentPreview({
  documentId,
  documentTypeName,
  releaseId,
  previewValues,
  isLoading,
  releaseState,
  documentRevision,
}: ReleaseDocumentPreviewProps) {
  const documentPresence = useDocumentPresence(documentId)

  const intentParams = useMemo(() => {
    if (releaseState !== 'published' && releaseState !== 'archived') return {}

    const rev = releaseState === 'archived' ? '@lastEdited' : '@lastPublished'

    return {
      rev,
      inspect: 'sanity/structure/history',
      historyEvent: documentRevision,
      historyVersion: getReleaseIdFromReleaseDocumentId(releaseId),
    }
  }, [documentRevision, releaseId, releaseState])

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
            searchParams={[
              [
                'perspective',
                releaseState === 'published'
                  ? 'published'
                  : getReleaseIdFromReleaseDocumentId(releaseId),
              ],
            ]}
            ref={ref}
          />
        )
      }),
    [documentId, documentTypeName, intentParams, releaseId, releaseState],
  )

  const previewPresence = useMemo(
    () => documentPresence?.length > 0 && <DocumentPreviewPresence presence={documentPresence} />,
    [documentPresence],
  )

  return (
    <Card tone="inherit" as={LinkComponent} radius={2} data-as="a">
      <SanityDefaultPreview {...previewValues} status={previewPresence} isPlaceholder={isLoading} />
    </Card>
  )
}
