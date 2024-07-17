import {type PreviewValue} from '@sanity/types'
import {Card} from '@sanity/ui'
import {type ForwardedRef, forwardRef, useMemo} from 'react'
import {IntentLink} from 'sanity/router'

import {SanityDefaultPreview} from '../../preview/components/SanityDefaultPreview'
import {getPublishedId} from '../../util/draftUtils'

interface ReleaseDocumentPreviewProps {
  documentId: string
  documentTypeName: string
  releaseSlug: string
  previewValues: PreviewValue
  isLoading: boolean
}

export function ReleaseDocumentPreview({
  documentId,
  documentTypeName,
  releaseSlug,
  previewValues,
  isLoading,
}: ReleaseDocumentPreviewProps) {
  const LinkComponent = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      forwardRef(function LinkComponent(linkProps, ref: ForwardedRef<HTMLAnchorElement>) {
        return (
          <IntentLink
            {...linkProps}
            intent="edit"
            params={{
              id: getPublishedId(documentId, true),
              type: documentTypeName,
            }}
            searchParams={[['perspective', `bundle.${releaseSlug}`]]}
            ref={ref}
          />
        )
      }),
    [documentId, documentTypeName, releaseSlug],
  )

  return (
    <Card as={LinkComponent} radius={2} data-as="a">
      <SanityDefaultPreview {...previewValues} isPlaceholder={isLoading} />
    </Card>
  )
}
