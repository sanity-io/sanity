import {type SchemaType} from '@sanity/types'
import {Badge} from '@sanity/ui'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {styled} from 'styled-components'
import {Flex, Box} from 'ui5'

import {DocumentVersionsMarks} from '../../../../../../../components/documentStatus/DocumentVersionsMarks'
import {DocumentVersionsStatus} from '../../../../../../../components/documentStatus/DocumentVersionsStatus'
import {DocumentVersionsStatusIndicator} from '../../../../../../../components/documentStatusIndicator/DocumentVersionsStatusIndicator'
import {type GeneralPreviewLayoutKey} from '../../../../../../../components/previews/types'
import {type PerspectiveStack} from '../../../../../../../perspective/types'
import {DocumentPreviewPresence} from '../../../../../../../presence/DocumentPreviewPresence'
import {SanityDefaultPreview} from '../../../../../../../preview/components/SanityDefaultPreview'
import {getPreviewStateObservable} from '../../../../../../../preview/utils/getPreviewStateObservable'
import {getPreviewValueWithFallback} from '../../../../../../../preview/utils/getPreviewValueWithFallback'
import {useDocumentVersions} from '../../../../../../../releases/hooks/useDocumentVersions'
import {useDocumentPreviewStore} from '../../../../../../../store/datastores'
import {type DocumentPresence} from '../../../../../../../store/presence/types'
import {useWorkspace} from '../../../../../../workspace'

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
  /**
   * With the document group inventory enabled: no versions tooltip on the row (it opened below the
   * row, over the other results), and the marks carry a spoken summary of the versions instead.
   */
  quietVersionsStatus?: boolean
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
  quietVersionsStatus = false,
}: SearchResultItemPreviewProps) {
  const documentPreviewStore = useDocumentPreviewStore()
  const inventoryEnabled = useWorkspace().beta?.documentGroupInventory?.enabled === true
  const quiet = quietVersionsStatus && inventoryEnabled

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

  const {isLoading, snapshot, original} = useObservable(observable, INITIAL_PREVIEW_STATE)

  const {versions} = useDocumentVersions({documentId})

  const status = useMemo(() => {
    if (isLoading) return null
    return (
      <Flex alignItems="center" gap={3}>
        {presence && presence.length > 0 && <DocumentPreviewPresence presence={presence} />}
        {showBadge && <Badge>{schemaType.title}</Badge>}
        {quiet ? (
          <DocumentVersionsMarks versionCount={versions.length}>
            <DocumentVersionsStatusIndicator documentVersions={versions} />
          </DocumentVersionsMarks>
        ) : (
          <DocumentVersionsStatusIndicator documentVersions={versions} />
        )}
      </Flex>
    )
  }, [isLoading, presence, quiet, schemaType.title, showBadge, versions])

  const tooltip = quiet ? undefined : <DocumentVersionsStatus documentGroupId={documentId} />

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
