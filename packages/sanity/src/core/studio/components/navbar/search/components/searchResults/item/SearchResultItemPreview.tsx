import {type SchemaType} from '@sanity/types'
import {Badge} from '@sanity/ui'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {styled} from 'styled-components'
import {Flex, Box} from 'ui5'

import {
  DocumentVersionsMarksFlyout,
  SEARCH_RESULT_MARKS_SURFACE,
} from '../../../../../../../components/documentStatus/DocumentVersionsMarksFlyout'
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
   * Whether the result's status marks may open the versions flyout (with the document group
   * inventory enabled), in place of the read-only versions tooltip on the row.
   */
  versionsFlyout?: boolean
  /** Runs after the versions flyout opened the document: closes the search. */
  onVersionsFlyoutNavigate?: () => void
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
  versionsFlyout = false,
  onVersionsFlyoutNavigate,
}: SearchResultItemPreviewProps) {
  const documentPreviewStore = useDocumentPreviewStore()
  const inventoryEnabled = useWorkspace().beta?.documentGroupInventory?.enabled === true
  const withFlyout = versionsFlyout && inventoryEnabled

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
        {withFlyout ? (
          <DocumentVersionsMarksFlyout
            documentId={documentId}
            documentType={documentType}
            onNavigate={onVersionsFlyoutNavigate}
            presence={presence}
            surface={SEARCH_RESULT_MARKS_SURFACE}
            versionCount={versions.length}
          >
            <DocumentVersionsStatusIndicator documentVersions={versions} />
          </DocumentVersionsMarksFlyout>
        ) : (
          <DocumentVersionsStatusIndicator documentVersions={versions} />
        )}
      </Flex>
    )
  }, [
    documentId,
    documentType,
    isLoading,
    onVersionsFlyoutNavigate,
    presence,
    schemaType.title,
    showBadge,
    versions,
    withFlyout,
  ])

  // With the flyout on the marks, the read-only tooltip on the row goes: it opened below the row,
  // over the other results
  const tooltip = withFlyout ? undefined : <DocumentVersionsStatus documentGroupId={documentId} />

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
