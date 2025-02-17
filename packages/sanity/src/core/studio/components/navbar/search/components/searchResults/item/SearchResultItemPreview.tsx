import {type SchemaType} from '@sanity/types'
import {Badge, Box, Flex} from '@sanity/ui'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {styled} from 'styled-components'

import {type GeneralPreviewLayoutKey} from '../../../../../../../components'
import {DocumentStatus} from '../../../../../../../components/documentStatus'
import {DocumentStatusIndicator} from '../../../../../../../components/documentStatusIndicator'
import {usePerspective} from '../../../../../../../perspective/usePerspective'
import {DocumentPreviewPresence} from '../../../../../../../presence'
import {
  getPreviewStateObservable,
  getPreviewValueWithFallback,
  SanityDefaultPreview,
} from '../../../../../../../preview'
import {useDocumentVersionInfo} from '../../../../../../../releases'
import {useActiveReleases} from '../../../../../../../releases/store/useActiveReleases'
import {isPerspectiveRaw} from '../../../../../../../search/common/isPerspectiveRaw'
import {type DocumentPresence, useDocumentPreviewStore} from '../../../../../../../store'
import {useSearchState} from '../../../contexts/search/useSearchState'

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
  layout,
  perspective,
  presence,
  schemaType,
  showBadge = true,
}: SearchResultItemPreviewProps) {
  const documentPreviewStore = useDocumentPreviewStore()
  const {data, loading} = useActiveReleases()
  const {perspectiveStack} = usePerspective()
  const {state} = useSearchState()
  const isRaw = isPerspectiveRaw(state.perspective)

  const observable = useMemo(() => {
    const stack = state.perspective && !isRaw ? state.perspective : perspectiveStack
    return getPreviewStateObservable(
      documentPreviewStore,
      schemaType,
      documentId,
      Array.isArray(stack) ? stack : [],
    )
  }, [documentPreviewStore, schemaType, documentId, state.perspective, perspectiveStack, isRaw])

  const {isLoading: previewIsLoading, snapshot} = useObservable(observable, {
    snapshot: null,
    isLoading: true,
  })

  const isLoading = previewIsLoading || loading

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
        {...getPreviewValueWithFallback({snapshot})}
        isPlaceholder={isLoading ?? true}
        layout={layout || 'default'}
        icon={schemaType.icon}
        status={status}
        tooltip={tooltip}
      />
    </SearchResultItemPreviewBox>
  )
}
