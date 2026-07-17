import {type ReleaseDocument} from '@sanity/client'
import {Box, Card, Flex, Text} from '@sanity/ui'
import {type ForwardedRef, forwardRef, useMemo} from 'react'
import {IntentLink} from 'sanity/router'

import {type PreviewLayoutKey} from '../../../../components/previews/types'
import {DocumentPreviewPresence} from '../../../../presence'
import {SanityDefaultPreview} from '../../../../preview/components/SanityDefaultPreview'
import {ReleaseAvatarIcon} from '../../../../releases/components/ReleaseAvatar'
import {useDocumentPresence} from '../../../../store/presence/useDocumentPresence'
import {useDocumentPreviewValues} from '../../../../tasks/hooks/useDocumentPreviewValues'
import {getPublishedId} from '../../../../util/draftUtils'
import {isPublishedBundleId} from '../../util'
import {getPrimaryBundle} from '../releaseLane'
import {type DocumentInVariantGroup} from '../types'

interface VariantDocumentPreviewProps {
  row: DocumentInVariantGroup
  releasesById: Map<string, ReleaseDocument>
  layout?: PreviewLayoutKey
  variantId?: string
}

// Leading badge that reuses the shared perspective-bar iconography, so a document's primary
// bundle is recognisable at a glance in the preview column too.
function PrimaryBundleIcon({
  row,
  releasesById,
}: {
  row: DocumentInVariantGroup
  releasesById: Map<string, ReleaseDocument>
}) {
  const primary = getPrimaryBundle(row, releasesById)
  if (!primary) return null

  return (
    <Box flex="none">
      <Text size={1}>
        {primary.kind === 'published' ? (
          <ReleaseAvatarIcon tone="positive" />
        ) : primary.kind === 'drafts' ? (
          <ReleaseAvatarIcon tone="caution" />
        ) : primary.release ? (
          <ReleaseAvatarIcon release={primary.release} />
        ) : (
          <ReleaseAvatarIcon tone="default" />
        )}
      </Text>
    </Box>
  )
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
  releasesById,
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
    <Flex align="center" gap={2}>
      <PrimaryBundleIcon releasesById={releasesById} row={row} />
      <Card
        tone="inherit"
        as={VariantDocumentPreviewLink}
        publishedId={publishedId}
        documentType={row.document._type}
        searchParams={searchParams}
        radius={2}
        data-as="a"
        flex={1}
        style={{minWidth: 0}}
      >
        <SanityDefaultPreview
          {...(resolvedPreview || {})}
          status={previewPresence}
          isPlaceholder={previewLoading}
          layout={layout}
        />
      </Card>
    </Flex>
  )
}
