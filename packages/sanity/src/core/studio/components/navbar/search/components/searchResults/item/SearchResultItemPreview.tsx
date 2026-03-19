import {type SchemaType} from '@sanity/types'
import {Badge, Box, Flex} from '@sanity/ui'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {type GeneralPreviewLayoutKey} from '../../../../../../../components'
import {DocumentStatus} from '../../../../../../../components/documentStatus'
import {DocumentStatusIndicator} from '../../../../../../../components/documentStatusIndicator'
import {type PerspectiveStack} from '../../../../../../../perspective/types'
import {DocumentPreviewPresence} from '../../../../../../../presence'
import {
  getPreviewStateObservable,
  getPreviewValueWithFallback,
  SanityDefaultPreview,
} from '../../../../../../../preview'
import {useDocumentVersionInfo} from '../../../../../../../releases'
import {type DocumentPresence, useDocumentPreviewStore} from '../../../../../../../store'
import {searchResultItemPreviewBox} from './SearchResultItemPreview.css'

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
    <Box className={searchResultItemPreviewBox}>
      <SanityDefaultPreview
        {...getPreviewValueWithFallback({snapshot, original, fallback: documentStub})}
        isPlaceholder={isLoading ?? true}
        layout={layout || 'default'}
        icon={schemaType.icon}
        status={status}
        tooltip={tooltip}
      />
    </Box>
  )
}
