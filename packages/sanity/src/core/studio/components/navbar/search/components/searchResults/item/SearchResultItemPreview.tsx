import {type SchemaType} from '@sanity/types'
import {Badge, Box, Flex} from '@sanity/ui'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {styled} from 'styled-components'

import {DocumentStatus} from '../../../../../../../components/documentStatus/DocumentStatus'
import {DocumentStatusIndicator} from '../../../../../../../components/documentStatusIndicator/DocumentStatusIndicator'
import {type GeneralPreviewLayoutKey} from '../../../../../../../components/previews/types'
import {type PerspectiveStack} from '../../../../../../../perspective/types'
import {DocumentPreviewPresence} from '../../../../../../../presence/DocumentPreviewPresence'
import {SanityDefaultPreview} from '../../../../../../../preview/components/SanityDefaultPreview'
import {getPreviewStateObservable} from '../../../../../../../preview/utils/getPreviewStateObservable'
import {getPreviewValueWithFallback} from '../../../../../../../preview/utils/getPreviewValueWithFallback'
import {useDocumentVersions} from '../../../../../../../releases/hooks/useDocumentVersions'
import {getDocumentVersionInfoFromVersions} from '../../../../../../../releases/util/getDocumentVersionInfoFromVersions'
import {useDocumentPreviewStore} from '../../../../../../../store/datastores'
import {type DocumentPresence} from '../../../../../../../store/presence/types'

interface SearchResultItemPreviewProps {
  documentId: string
  documentType: string
  layout?: GeneralPreviewLayoutKey
  presence?: DocumentPresence[]
  perspective?: PerspectiveStack
  /**
   * The variant the preview is resolved in, as a bare variant id. Travels with `perspective`.
   */
  variant?: string
  schemaType: SchemaType
  showBadge?: boolean
}

const INITIAL_PREVIEW_STATE = {
  snapshot: null,
  isLoading: true,
  original: null,
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
  variant,
}: SearchResultItemPreviewProps) {
  const documentPreviewStore = useDocumentPreviewStore()

  const observable = useMemo(() => {
    return getPreviewStateObservable(
      documentPreviewStore,
      schemaType,
      documentId,
      perspective,
      undefined,
      variant,
    )
  }, [documentPreviewStore, schemaType, documentId, perspective, variant])

  const documentStub = useMemo(
    () => ({_id: documentId, _type: documentType}),
    [documentId, documentType],
  )

  // Deferred: react-rx v5's deferral is identity-coherent, so on a document
  // id change the live snapshot wins and the previous document's title/media
  // never renders next to the new document's version badges.
  const {isLoading, snapshot, original} = useObservable(observable, INITIAL_PREVIEW_STATE)

  const {versions} = useDocumentVersions({documentId})
  const versionsInfo = useMemo(() => getDocumentVersionInfoFromVersions(versions), [versions])

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
