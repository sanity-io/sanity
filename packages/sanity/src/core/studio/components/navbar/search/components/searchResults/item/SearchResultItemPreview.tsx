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
import {type DocumentPresence, useDocumentPreviewStore} from '../../../../../../../store'

interface SearchResultItemPreviewProps {
  documentId: string
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
  presence,
  schemaType,
  showBadge = true,
}: SearchResultItemPreviewProps) {
  const documentPreviewStore = useDocumentPreviewStore()
  const {perspectiveStack, selectedPerspective} = usePerspective()

  const observable = useMemo(() => {
    return getPreviewStateObservable(
      documentPreviewStore,
      schemaType,
      documentId, // eslint-disable-next-line no-nested-ternary
      !selectedPerspective || selectedPerspective === 'drafts'
        ? ['drafts']
        : selectedPerspective === 'published'
          ? ['published']
          : perspectiveStack,
    )
  }, [documentPreviewStore, schemaType, documentId, selectedPerspective, perspectiveStack])

  const {isLoading, snapshot} = useObservable(observable, {
    snapshot: null,
    isLoading: true,
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
