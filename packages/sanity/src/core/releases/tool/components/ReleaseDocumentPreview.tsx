import {type ReleaseState} from '@sanity/client'
import {Card} from '@sanity/ui'
import {useMemo, type RefAttributes} from 'react'
import {IntentLink} from 'sanity/router'

import {type PreviewLayoutKey} from '../../../components/previews/types'
import {type PerspectiveStack} from '../../../perspective/types'
import {DocumentPreviewPresence} from '../../../presence/DocumentPreviewPresence'
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
  /** The document is marked to be unpublished when the release is run (`_system.delete`). */
  isGoingToUnpublish?: boolean
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
  isGoingToUnpublish = false,
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
      function LinkComponent(
        linkProps: React.ComponentPropsWithoutRef<'a'> & RefAttributes<HTMLAnchorElement>,
      ) {
        const {ref, ...rest} = linkProps
        return (
          <IntentLink
            {...rest}
            intent="edit"
            params={params}
            searchParams={searchParams}
            ref={ref}
          />
        )
      },
    [params, searchParams],
  )

  const previewPresence = useMemo(
    () => documentPresence?.length > 0 && <DocumentPreviewPresence presence={documentPresence} />,
    [documentPresence],
  )

  // A document marked to be unpublished previews the document the release acts on rather than its
  // own version, matching the document pane, which shows the current published version for these.
  // Running the release deletes that published document and leaves the content behind as a draft,
  // so once the release has run resolve through drafts instead. The drafts perspective still layers
  // over published, so it also covers the document having been republished since.
  const perspectiveStack = useMemo<PerspectiveStack>(() => {
    if (!isGoingToUnpublish) return [getReleaseIdFromReleaseDocumentId(releaseId)]
    return releaseState === 'published' ? ['drafts'] : []
  }, [isGoingToUnpublish, releaseId, releaseState])

  const {isLoading: previewLoading, value: resolvedPreview} = useDocumentPreviewValues({
    documentId: isGoingToUnpublish ? getPublishedId(documentId) : documentId,
    documentType: documentTypeName,
    perspectiveStack,
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
