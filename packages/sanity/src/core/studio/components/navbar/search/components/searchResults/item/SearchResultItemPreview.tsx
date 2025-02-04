import {type SanityDocument} from '@sanity/client'
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
import {useActiveReleases} from '../../../../../../../releases/store/useActiveReleases'
import {useReleasesIds} from '../../../../../../../releases/store/useReleasesIds'
import {isPerspectiveRaw} from '../../../../../../../search/common/isPerspectiveRaw'
import {type DocumentPresence, useDocumentPreviewStore} from '../../../../../../../store'
import {isArray} from '../../../../../../../util/isArray'
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
  const {releasesIds} = useReleasesIds(data)
  const {perspectiveStack} = usePerspective()
  const {state} = useSearchState()
  const isRaw = isPerspectiveRaw(state.perspective)

  const observable = useMemo(() => {
    const stack = state.perspective && !isRaw ? state.perspective : perspectiveStack
    return getPreviewStateObservable(documentPreviewStore, schemaType, documentId, '', {
      ids: releasesIds,
      /**
       * if the perspective is defined in the state it means that there is a scope to the search
       * and that the preview needs to take that into account
       */
      stack: Array.isArray(stack) ? stack : [],
      isRaw: isRaw,
    })
  }, [
    documentPreviewStore,
    schemaType,
    documentId,
    releasesIds,
    state.perspective,
    perspectiveStack,
    isRaw,
  ])

  const {
    draft,
    published,
    isLoading: previewIsLoading,
    version,
    versions,
  } = useObservable(observable, {
    draft: null,
    isLoading: true,
    published: null,
    version: null,
    versions: {},
  })

  const isLoading = previewIsLoading || loading

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
        <DocumentStatusIndicator draft={draft} published={published} versions={versions} />
      </Flex>
    )
  }, [draft, isLoading, presence, published, schemaType.title, showBadge, versions])

  const tooltip = <DocumentStatus draft={draft} published={published} versions={versions} />

  return (
    <SearchResultItemPreviewBox>
      <SanityDefaultPreview
        {...getPreviewValueWithFallback({
          draft,
          published,
          version,
          value: sanityDocument,
          perspective: isArray(perspective) ? perspective[0] : perspective,
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
