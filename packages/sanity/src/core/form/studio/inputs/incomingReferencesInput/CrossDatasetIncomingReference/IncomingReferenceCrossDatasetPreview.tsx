import {type CrossDatasetIncomingReference} from '@sanity/types'
import {Box, Flex} from '@sanity/ui'

import {PreviewCard} from '../../../../../components/previewCard/PreviewCard'
import {CrossDatasetReferencePreview} from '../../../../inputs/CrossDatasetReferenceInput/CrossDatasetReferencePreview'
import {type CrossDatasetIncomingReferenceDocument} from './getCrossDatasetIncomingReferences'

/**
 * @internal
 */
export function IncomingReferenceCrossDatasetPreview({
  type,
  document,
}: {
  document: CrossDatasetIncomingReferenceDocument
  type?: CrossDatasetIncomingReference
}) {
  const studioUrl = type?.studioUrl?.({id: document.id, type: document.type})
  return (
    <Flex key={document.id} gap={1} align="center">
      <Box flex={1}>
        <PreviewCard
          data-as={studioUrl ? 'a' : 'div'}
          flex={1}
          radius={2}
          paddingRight={studioUrl ? 3 : 0}
          tone="inherit"
          __unstable_focusRing
          tabIndex={0}
          {...(studioUrl
            ? {href: studioUrl, target: '_blank', rel: 'noopener noreferrer', as: 'a'}
            : {})}
        >
          <CrossDatasetReferencePreview
            availability={document.availability}
            hasStudioUrl={Boolean(studioUrl)}
            showStudioUrlIcon={Boolean(studioUrl)}
            preview={document.preview}
            refType={
              type
                ? {
                    type: type.type,
                    title: document.preview.published?.title,
                    icon: () => null,
                    preview: type.preview,
                  }
                : undefined
            }
            projectId={document.projectId}
            dataset={document.dataset}
            id={document.id}
            showTypeLabel={false}
          />
        </PreviewCard>
      </Box>
    </Flex>
  )
}
