import {ErrorOutlineIcon} from '@sanity/icons'
import {type PreviewValue} from '@sanity/types'
import {Card, Text, Tooltip} from '@sanity/ui'
import {type ForwardedRef, forwardRef, useMemo} from 'react'
import {DocumentPreviewPresence, useDocumentPresence} from 'sanity'
import {IntentLink} from 'sanity/router'

import {useTranslation} from '../../i18n'
import {SanityDefaultPreview} from '../../preview/components/SanityDefaultPreview'
import {getPublishedId} from '../../util/draftUtils'
import {releasesLocaleNamespace} from '../i18n'

interface ReleaseDocumentPreviewProps {
  documentId: string
  documentTypeName: string
  releaseSlug: string
  previewValues: PreviewValue
  isLoading: boolean
  hasValidationError?: boolean
}

export function ReleaseDocumentPreview({
  documentId,
  documentTypeName,
  releaseSlug,
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
            searchParams={[['perspective', `bundle.${releaseSlug}`]]}
            ref={ref}
          />
        )
      }),
    [documentId, documentTypeName, releaseSlug],
  )

  const previewPresence = useMemo(
    () => documentPresence?.length > 0 && <DocumentPreviewPresence presence={documentPresence} />,
    [documentPresence],
  )

  return (
    <Card
      tone={hasValidationError ? 'critical' : 'default'}
      as={LinkComponent}
      radius={2}
      data-as="a"
    >
      <SanityDefaultPreview {...previewValues} status={previewPresence} isPlaceholder={isLoading}>
        {hasValidationError && (
          <Tooltip
            portal
            content={
              <Text muted size={1}>
                {t('document-validation.error')}
              </Text>
            }
          >
            <ErrorOutlineIcon />
          </Tooltip>
        )}
      </SanityDefaultPreview>
    </Card>
  )
}
