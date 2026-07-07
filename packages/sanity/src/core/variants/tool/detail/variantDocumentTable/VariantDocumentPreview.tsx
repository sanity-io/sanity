import {Card} from '@sanity/ui'
import {type ForwardedRef, forwardRef, useMemo} from 'react'
import {IntentLink} from 'sanity/router'

import {type PreviewLayoutKey} from '../../../../components/previews/types'
import {DocumentPreviewPresence} from '../../../../presence'
import {SanityDefaultPreview} from '../../../../preview/components/SanityDefaultPreview'
import {useDocumentPresence} from '../../../../store/presence/useDocumentPresence'
import {useDocumentPreviewValues} from '../../../../tasks/hooks/useDocumentPreviewValues'
import {getPublishedId} from '../../../../util/draftUtils'
import {isPublishedBundleId} from '../../util'
import {type DocumentInVariantGroup} from '../types'

interface VariantDocumentPreviewProps {
  row: DocumentInVariantGroup
  layout?: PreviewLayoutKey
  variantId?: string
}

interface VariantDocumentPreviewLinkProps extends React.ComponentPropsWithoutRef<'a'> {
  publishedId: string
  documentType: string
  searchParams: Array<[string, string]> | undefined
}

const VariantDocumentPreviewLink = forwardRef(function VariantDocumentPreviewLink(
  {publishedId, documentType, searchParams, ...linkProps}: VariantDocumentPreviewLinkProps,
  ref: ForwardedRef<HTMLAnchorElement>,
) {
  return (
    <IntentLink
      {...linkProps}
      intent="edit"
      params={{
        id: publishedId,
        type: documentType,
      }}
      searchParams={searchParams}
      ref={ref}
    />
  )
})

function getVersionPerspectiveNavigation(
  bundleId: DocumentInVariantGroup['version']['bundleId'],
  variantId?: string,
): {
  perspectiveStack: string[]
  searchParams: Array<[string, string]> | undefined
} {
  const searchParams: Array<[string, string]> = variantId ? [['variant', variantId]] : []

  if (isPublishedBundleId(bundleId)) {
    return {
      perspectiveStack: ['published'],
      searchParams: [...searchParams, ['perspective', 'published']],
    }
  }

  if (bundleId === 'drafts') {
    return {
      perspectiveStack: ['drafts'],
      searchParams: searchParams.length > 0 ? searchParams : undefined,
    }
  }

  return {
    perspectiveStack: [bundleId ?? '', 'drafts'],
    searchParams: [...searchParams, ['perspective', bundleId ?? '']],
  }
}

export function VariantDocumentPreview({
  row,
  layout,
  variantId,
}: VariantDocumentPreviewProps): React.JSX.Element {
  const publishedId = getPublishedId(row.groupId)
  const documentPresence = useDocumentPresence(row.document._id)
  const {perspectiveStack, searchParams} = useMemo(
    () => getVersionPerspectiveNavigation(row.version.bundleId, variantId),
    [row.version.bundleId, variantId],
  )

  const previewPresence = useMemo(
    () => documentPresence?.length > 0 && <DocumentPreviewPresence presence={documentPresence} />,
    [documentPresence],
  )

  const {isLoading: previewLoading, value: resolvedPreview} = useDocumentPreviewValues({
    documentId: row.document._id,
    documentType: row.document._type,
    perspectiveStack,
  })

  return (
    <Card
      tone="inherit"
      as={VariantDocumentPreviewLink}
      publishedId={publishedId}
      documentType={row.document._type}
      searchParams={searchParams}
      radius={2}
      data-as="a"
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
