import {type SanityDocument} from '@sanity/client'
import {type SchemaType} from '@sanity/types'
import {Badge, Box, Flex} from '@sanity/ui'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {getPublishedId, resolveBundlePerspective} from 'sanity'
import {styled} from 'styled-components'

import {type GeneralPreviewLayoutKey} from '../../../../../../../components'
import {DocumentStatus} from '../../../../../../../components/documentStatus'
import {DocumentStatusIndicator} from '../../../../../../../components/documentStatusIndicator'
import {DocumentPreviewPresence} from '../../../../../../../presence'
import {
  getPreviewStateObservable,
  getPreviewValueWithFallback,
  SanityDefaultPreview,
} from '../../../../../../../preview'
import {type DocumentPresence, useDocumentPreviewStore} from '../../../../../../../store'

interface SearchResultItemPreviewProps {
  documentId: string
  perspective?: string
  layout?: GeneralPreviewLayoutKey
  presence?: DocumentPresence[]
  schemaType: SchemaType
  showBadge?: boolean
}

/**
 * Temporary workaround: force all nested boxes on iOS to use `background-attachment: scroll`
 * to allow <Skeleton> components to render correctly within virtual lists.
 */
const SearchResultItemPreviewBox = styled(Box)<{$isInPerspective: boolean}>`
  opacity: ${(props) => (props.$isInPerspective ? 1 : 0.5)};
  @supports (-webkit-overflow-scrolling: touch) {
    * [data-ui='Box'] {
      background-attachment: scroll;
    }
  }
`

/**
 * @internal
 */
export function SearchResultItemPreview({
  documentId,
  layout,
  perspective,
  presence,
  schemaType,
  showBadge = true,
}: SearchResultItemPreviewProps) {
  const documentPreviewStore = useDocumentPreviewStore()

  const observable = useMemo(
    () =>
      getPreviewStateObservable(
        documentPreviewStore,
        schemaType,
        getPublishedId(documentId),
        '',
        resolveBundlePerspective(perspective),
      ),
    [documentId, documentPreviewStore, perspective, schemaType],
  )

  const {draft, published, isLoading, version} = useObservable(observable, {
    draft: null,
    isLoading: true,
    published: null,
    version: null,
  })

  const sanityDocument = useMemo(() => {
    return {
      _id: documentId,
      _type: schemaType.name,
    } as SanityDocument
  }, [documentId, schemaType.name])

  const status = useMemo(() => {
    if (isLoading) return null
    return (
      <Flex align="center" gap={3}>
        {presence && presence.length > 0 && <DocumentPreviewPresence presence={presence} />}
        {showBadge && <Badge>{schemaType.title}</Badge>}
        <DocumentStatusIndicator draft={draft} published={published} version={version} />
      </Flex>
    )
  }, [draft, isLoading, presence, published, schemaType.title, showBadge, version])

  const tooltip = <DocumentStatus draft={draft} published={published} version={version} />

  return (
    <SearchResultItemPreviewBox $isInPerspective={!perspective || Boolean(version)}>
      <SanityDefaultPreview
        {...getPreviewValueWithFallback({
          draft,
          published,
          version,
          value: sanityDocument,
          perspective,
        })}
        isPlaceholder={isLoading ?? true}
        layout={layout || 'default'}
        icon={schemaType.icon}
        status={status}
        tooltip={tooltip}
      />
    </SearchResultItemPreviewBox>
  )
}
