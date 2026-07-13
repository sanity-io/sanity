import {type ReleaseState} from '@sanity/client'
import {Card} from '@sanity/ui'
import {type ForwardedRef, forwardRef, useMemo} from 'react'
import {IntentLink} from 'sanity/router'

import {type PreviewLayoutKey} from '../../../components/previews/types'
import {DocumentPreviewPresence} from '../../../presence'
import {SanityDefaultPreview} from '../../../preview/components/SanityDefaultPreview'
import {useDocumentPresence} from '../../../store/presence/useDocumentPresence'
import {useDocumentPreviewValues} from '../../../tasks/hooks/useDocumentPreviewValues'
import {getPublishedId} from '../../../util/draftUtils'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {getReleaseDocumentIntent} from './getReleaseDocumentIntent'

interface ReleaseDocumentPreviewProps {
  documentId: string
  documentTypeName: string
  releaseId: string
  releaseState?: ReleaseState
  documentRevision?: string
  hasValidationError?: boolean
  layout?: PreviewLayoutKey
  isGoingToBePublished?: boolean
  isCardinalityOneRelease?: boolean
  variantId?: string
}

export function ReleaseDocumentPreview({
  documentId,
  documentTypeName,
  releaseId,
  releaseState,
  isCardinalityOneRelease,
  documentRevision,
  layout,
  isGoingToBePublished = false,
  variantId,
}: ReleaseDocumentPreviewProps) {
  const documentPresence = useDocumentPresence(documentId)

  const {params, searchParams} = useMemo(
    () =>
      getReleaseDocumentIntent({
        documentId,
        documentTypeName,
        releaseId,
        releaseState,
        documentRevision,
        isCardinalityOneRelease,
        variantId,
      }),
    [
      documentId,
      documentTypeName,
      releaseId,
      releaseState,
      documentRevision,
      isCardinalityOneRelease,
      variantId,
    ],
  )

  const LinkComponent = useMemo(
    () =>
      forwardRef(function LinkComponent(
        linkProps: React.ComponentPropsWithoutRef<'a'>,
        ref: ForwardedRef<HTMLAnchorElement>,
      ) {
        return (
          <IntentLink
            {...linkProps}
            intent="edit"
            params={params}
            searchParams={searchParams}
            ref={ref}
          />
        )
      }),
    [params, searchParams],
  )

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
    <Card tone="inherit" as={LinkComponent} radius={2} data-as="a">
      <SanityDefaultPreview
        {...(resolvedPreview || {})}
        status={previewPresence}
        isPlaceholder={previewLoading}
        layout={layout}
      />
    </Card>
  )
}
