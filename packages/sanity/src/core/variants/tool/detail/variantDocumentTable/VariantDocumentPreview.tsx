import {Card} from '@sanity/ui'
import {type ForwardedRef, forwardRef, useMemo} from 'react'
import {IntentLink} from 'sanity/router'

import {type PreviewLayoutKey} from '../../../../components/previews/types'
import {DocumentPreviewPresence} from '../../../../presence'
import {SanityDefaultPreview} from '../../../../preview/components/SanityDefaultPreview'
import {useDocumentPresence} from '../../../../store/presence/useDocumentPresence'
import {useDocumentPreviewValues} from '../../../../tasks/hooks/useDocumentPreviewValues'
import {getPublishedId} from '../../../../util/draftUtils'
import {type DocumentInVariantGroup} from '../types'

interface VariantDocumentPreviewProps {
  row: DocumentInVariantGroup
  layout?: PreviewLayoutKey
}

function getPerspectiveStackForVersion(
  bundleId: DocumentInVariantGroup['version']['bundleId'],
): string[] {
  if (bundleId === '$published') {
    return []
  }

  if (bundleId === 'drafts') {
    return ['drafts']
  }

  return [bundleId]
}

function getSearchParamsForVersion(
  bundleId: DocumentInVariantGroup['version']['bundleId'],
): Array<[string, string]> | undefined {
  if (bundleId === '$published') {
    return [['perspective', 'published']]
  }

  if (bundleId === 'drafts') {
    // Drafts is the default structure perspective — omit it from the URL.
    return undefined
  }

  return [['perspective', bundleId]]
}

export function VariantDocumentPreview({
  row,
  layout,
}: VariantDocumentPreviewProps): React.JSX.Element {
  const publishedId = getPublishedId(row.groupId)
  const documentPresence = useDocumentPresence(row.document._id)
  const perspectiveStack = getPerspectiveStackForVersion(row.version.bundleId)
  const searchParams = getSearchParamsForVersion(row.version.bundleId)

  const LinkComponent = useMemo(
    () =>
      forwardRef(function LinkComponent(linkProps, ref: ForwardedRef<HTMLAnchorElement>) {
        return (
          <IntentLink
            {...linkProps}
            intent="edit"
            params={{
              id: publishedId,
              type: row.document._type,
            }}
            searchParams={searchParams}
            ref={ref}
          />
        )
      }),
    [publishedId, row.document._type, searchParams],
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
