import {type PreviewValue} from '@sanity/types'
import {Card} from '@sanity/ui'
import {type ForwardedRef, forwardRef, useMemo} from 'react'
import {IntentLink} from 'sanity/router'

import {useTranslation} from '../../../i18n'
import {DocumentPreviewPresence} from '../../../presence'
import {SanityDefaultPreview} from '../../../preview/components/SanityDefaultPreview'
import {useDocumentPresence} from '../../../store'
import {getPublishedId} from '../../../util/draftUtils'
import {releasesLocaleNamespace} from '../../i18n'
import {getBundleIdFromReleaseDocumentId} from '../../util/getBundleIdFromReleaseDocumentId'

interface ReleaseDocumentPreviewProps {
  documentId: string
  documentTypeName: string
  releaseId: string
  previewValues: PreviewValue
  isLoading: boolean
  hasValidationError?: boolean
}

export function ReleaseDocumentPreview({
  documentId,
  documentTypeName,
  releaseId,
  previewValues,
  isLoading,
  hasValidationError,
}: ReleaseDocumentPreviewProps) {
  const documentPresence = useDocumentPresence(documentId)
  const {t} = useTranslation(releasesLocaleNamespace)

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
            searchParams={[
              ['perspective', `bundle.${getBundleIdFromReleaseDocumentId(releaseId)}`],
            ]}
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

  return (
    <Card tone="inherit" as={LinkComponent} radius={2} data-as="a">
      <SanityDefaultPreview {...previewValues} status={previewPresence} isPlaceholder={isLoading} />
    </Card>
  )
}
