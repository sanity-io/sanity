import {type SchemaType} from '@sanity/types'
import {Badge, Box, Flex} from '@sanity/ui'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {styled} from 'styled-components'

import type {GeneralPreviewLayoutKey} from '../../../../../../../components/previews/types'
import {DocumentStatus} from '../../../../../../../components/documentStatus/DocumentStatus'
import {DocumentStatusIndicator} from '../../../../../../../components/documentStatusIndicator/DocumentStatusIndicator'
import {type PerspectiveStack} from '../../../../../../../perspective/types'
import {DocumentPreviewPresence} from '../../../../../../../presence/DocumentPreviewPresence'
import {getPreviewStateObservable} from '../../../../../../../preview/utils/getPreviewStateObservable'
import {getPreviewValueWithFallback} from '../../../../../../../preview/utils/getPreviewValueWithFallback'
import {SanityDefaultPreview} from '../../../../../../../preview/components/SanityDefaultPreview'
import {useDocumentVersionInfo} from '../../../../../../../releases/store/useDocumentVersionInfo'
import type {DocumentPresence} from '../../../../../../../store/_legacy/presence/types'
import {useDocumentPreviewStore} from '../../../../../../../store/_legacy/datastores'

interface SearchResultItemPreviewProps {
  documentId: string
  documentType: string
  layout?: GeneralPreviewLayoutKey
  presence?: DocumentPresence[]
  perspective?: PerspectiveStack
  schemaType: SchemaType
  showBadge?: boolean
}

/**
 * Temporary workaround: force all nested boxes on iOS to use `background-attachment: scroll`
 * to allow <Skeleton> components to render correctly within virtual lists.
 */
const SearchResultItemPreviewBox = styled(Box)`
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
  documentType,
  layout,
  presence,
  schemaType,
  showBadge = true,
  perspective,
}: SearchResultItemPreviewProps) {
  const documentPreviewStore = useDocumentPreviewStore()

  const observable = useMemo(() => {
    return getPreviewStateObservable(documentPreviewStore, schemaType, documentId, perspective)
  }, [documentPreviewStore, schemaType, documentId, perspective])

  const documentStub = useMemo(
    () => ({_id: documentId, _type: documentType}),
    [documentId, documentType],
  )

  const {isLoading, snapshot, original} = useObservable(observable, {
    snapshot: null,
    isLoading: true,
    original: null,
  })

  const versionsInfo = useDocumentVersionInfo(documentId)

  const status = useMemo(() => {
    if (isLoading) return null
    return (
      <Flex align="center" gap={3}>
        {presence && presence.length > 0 && <DocumentPreviewPresence presence={presence} />}
        {showBadge && <Badge>{schemaType.title}</Badge>}
        <DocumentStatusIndicator
          draft={versionsInfo.draft}
          published={versionsInfo.published}
          versions={versionsInfo.versions}
        />
      </Flex>
    )
  }, [
    isLoading,
    presence,
    schemaType.title,
    showBadge,
    versionsInfo.draft,
    versionsInfo.published,
    versionsInfo.versions,
  ])

  const tooltip = (
    <DocumentStatus
      draft={versionsInfo.draft}
      published={versionsInfo.published}
      versions={versionsInfo.versions}
    />
  )

  return (
    <SearchResultItemPreviewBox>
      <SanityDefaultPreview
        {...getPreviewValueWithFallback({snapshot, original, fallback: documentStub})}
        isPlaceholder={isLoading ?? true}
        layout={layout || 'default'}
        icon={schemaType.icon}
        status={status}
        tooltip={tooltip}
      />
    </SearchResultItemPreviewBox>
  )
}
