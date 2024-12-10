import {type PreviewValue} from '@sanity/types'
import {Card} from '@sanity/ui'
import {type ForwardedRef, forwardRef, useMemo} from 'react'
import {IntentLink} from 'sanity/router'

import {DocumentPreviewPresence} from '../../../presence'
import {SanityDefaultPreview} from '../../../preview/components/SanityDefaultPreview'
import {getPublishedId} from '../../../util/draftUtils'
import {useDocumentPresence} from '../../index'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'

interface ReleaseDocumentPreviewProps {
  documentId: string
  documentTypeName: string
  releaseId: string
  previewValues: PreviewValue
  isLoading: boolean
  revision?: string
  hasValidationError?: boolean
}

export function ReleaseDocumentPreview({
  documentId,
  documentTypeName,
  releaseId,
  previewValues,
  isLoading,
  revision,
  hasValidationError,
}: ReleaseDocumentPreviewProps) {
  const documentPresence = useDocumentPresence(documentId)

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
            }}
            searchParams={[['perspective', getReleaseIdFromReleaseDocumentId(releaseId)]]}
            ref={ref}
          />
        )
      }),
    [documentId, documentTypeName, releaseId],
  )

  const previewPresence = useMemo(
    () => documentPresence?.length > 0 && <DocumentPreviewPresence presence={documentPresence} />,
    [documentPresence],
  )

  const preview = (
    <SanityDefaultPreview {...previewValues} status={previewPresence} isPlaceholder={isLoading} />
  )

  /** @todo revision deeplink support for archived and published version docs */
  if (revision) return preview

  return (
    <Card tone="inherit" as={LinkComponent} radius={2} data-as="a">
      {preview}
    </Card>
  )
}
