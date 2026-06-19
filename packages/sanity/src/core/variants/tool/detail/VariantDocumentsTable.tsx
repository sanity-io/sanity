import {type ReleaseDocument, type SanityDocument} from '@sanity/client'
import {type DocumentSystem} from '@sanity/types'
import {Badge, type BadgeTone, Box, Card, Flex, Text} from '@sanity/ui'
import {type CSSProperties, memo, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'

import {RelativeTime} from '../../../components/RelativeTime'
import {useSchema} from '../../../hooks'
import {type UseTranslationResponse, useTranslation} from '../../../i18n'
import {SanityDefaultPreview} from '../../../preview/components/SanityDefaultPreview'
import {useReleasesStore} from '../../../releases/store/useReleasesStore'
import {Table} from '../../../releases/tool/components/Table/Table'
import {Headers} from '../../../releases/tool/components/Table/TableHeader'
import {type Column} from '../../../releases/tool/components/Table/types'
import {getReleaseIdFromReleaseDocumentId} from '../../../releases/util/getReleaseIdFromReleaseDocumentId'
import {getReleaseTitleDetails} from '../../../releases/util/getReleaseTitleDetails'
import {getReleaseTone} from '../../../releases/util/getReleaseTone'
import {variantsLocaleNamespace} from '../../i18n'

interface VariantDocumentVersion {
  label: string
  tone: BadgeTone
}

interface VariantDocumentRow {
  document: SanityDocument
  version: VariantDocumentVersion
}

/**
 * Derives the bundle a variant document belongs to from its `_system` metadata and returns the
 * label and tone for its version chip. Variant documents are scoped to both a variant and a bundle
 * (a release, the published bundle, or drafts).
 */
function getVariantDocumentVersion({
  document,
  releasesById,
  t,
}: {
  document: SanityDocument
  releasesById: Map<string, ReleaseDocument> | undefined
  t: UseTranslationResponse<'variants', undefined>['t']
}): VariantDocumentVersion {
  const system = document._system as DocumentSystem | undefined
  const releaseRef = system?.release?._ref

  if (releaseRef) {
    const release = releasesById?.get(releaseRef)

    if (release) {
      const {displayTitle} = getReleaseTitleDetails(
        release.metadata?.title,
        getReleaseIdFromReleaseDocumentId(release._id),
      )

      return {label: displayTitle, tone: getReleaseTone(release)}
    }

    return {label: getReleaseIdFromReleaseDocumentId(releaseRef), tone: 'default'}
  }

  if (system?.bundleId === 'drafts') {
    return {label: t('detail.documents.table.version.drafts'), tone: getReleaseTone('drafts')}
  }

  return {label: t('detail.documents.table.version.published'), tone: getReleaseTone('published')}
}

const TABLE_CARD_STYLE: CSSProperties = {
  height: '100%',
  overflow: 'auto',
}

function getDocumentPreviewTitle(document: SanityDocument): string {
  const title = document.title || document.name

  return typeof title === 'string' && title.trim() ? title : document._id
}

const MemoDocumentType = memo(
  function DocumentType({type}: {type: string}) {
    const schema = useSchema()
    const schemaType = schema.get(type)

    return <Text size={1}>{schemaType?.title || type}</Text>
  },
  (prev, next) => prev.type === next.type,
)

function getVariantDocumentVersionSortRank(document: SanityDocument): number {
  const system = document._system as DocumentSystem | undefined

  if (system?.release?._ref) {
    return 2
  }

  if (system?.bundleId === 'drafts') {
    return 1
  }

  return 0
}

function getVariantDocumentGroupSortKey({document, version}: VariantDocumentRow): string {
  const groupRef = (document._system as DocumentSystem | undefined)?.group._ref ?? document._id
  const versionRank = getVariantDocumentVersionSortRank(document)

  // Group by document family, then order versions Published → Drafts → Releases.
  return `${groupRef}\0${versionRank}\0${version.label}\0${document._id}`
}

function getVariantDocumentColumnDefs(
  t: UseTranslationResponse<'variants', undefined>['t'],
): Column<VariantDocumentRow>[] {
  return [
    {
      id: 'documentGroup',
      hidden: true,
      width: null,
      sorting: true,
      sortTransform: getVariantDocumentGroupSortKey,
    },
    {
      id: 'version',
      width: null,
      style: {minWidth: 100},
      sorting: false,
      header: (props) => (
        <Flex {...props.headerProps} paddingY={3} sizing="border">
          <Headers.BasicHeader text={t('detail.documents.table.version')} />
        </Flex>
      ),
      cell: ({cellProps, datum}) => (
        <Flex align="center" {...cellProps}>
          <Box paddingX={2}>
            {!datum.isLoading && datum.version && (
              <Badge fontSize={1} mode="outline" radius={2} tone={datum.version.tone}>
                {datum.version.label}
              </Badge>
            )}
          </Box>
        </Flex>
      ),
    },
    {
      id: 'document._type',
      width: null,
      style: {minWidth: 100},
      sorting: true,
      header: (props) => (
        <Flex {...props.headerProps} paddingY={3} sizing="border">
          <Headers.SortHeaderButton text={t('detail.documents.table.type')} {...props} />
        </Flex>
      ),
      cell: ({cellProps, datum}) => (
        <Flex align="center" {...cellProps}>
          <Box paddingX={2}>
            {!datum.isLoading && <MemoDocumentType type={datum.document._type} />}
          </Box>
        </Flex>
      ),
    },
    {
      id: 'search',
      width: null,
      style: {minWidth: 'min(50%, calc(100vw - 80px))', maxWidth: 'min(50%, calc(100vw - 80px))'},
      sortTransform: ({document}) => getDocumentPreviewTitle(document).toLowerCase(),
      header: (props) => (
        <Headers.TableHeaderSearch
          {...props}
          placeholder={t('detail.documents.table.search-placeholder')}
        />
      ),
      cell: ({cellProps, datum}) => (
        <Box {...cellProps} flex={1} padding={1} paddingRight={2} sizing="border">
          {datum.isLoading ? (
            <SanityDefaultPreview isPlaceholder />
          ) : (
            <SanityDefaultPreview
              title={getDocumentPreviewTitle(datum.document)}
              subtitle={datum.document._id}
            />
          )}
        </Box>
      ),
    },
    {
      id: 'document._updatedAt',
      sorting: true,
      width: 130,
      header: (props) => (
        <Flex {...props.headerProps} paddingY={3} sizing="border">
          <Headers.SortHeaderButton text={t('detail.documents.table.edited')} {...props} />
        </Flex>
      ),
      cell: ({cellProps, datum}) => (
        <Flex {...cellProps} align="center" paddingX={2} paddingY={3} style={{minWidth: 130}}>
          {!datum.isLoading && datum.document._updatedAt && (
            <Text muted size={1}>
              <RelativeTime time={datum.document._updatedAt} useTemporalPhrase minimal />
            </Text>
          )}
        </Flex>
      ),
    },
  ]
}

function filterDocuments(rows: VariantDocumentRow[], searchTerm: string): VariantDocumentRow[] {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase()

  if (!normalizedSearchTerm) {
    return rows
  }

  return rows.filter(({document}) =>
    [getDocumentPreviewTitle(document), document._id, document._type].some((value) =>
      value.toLowerCase().includes(normalizedSearchTerm),
    ),
  )
}

export function VariantDocumentsTable({
  documents,
}: {
  documents: SanityDocument[]
}): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)
  const [scrollContainerRef, setScrollContainerRef] = useState<HTMLDivElement | null>(null)
  const {state$} = useReleasesStore()
  const releasesState = useObservable(state$)
  const releasesById = releasesState?.releases
  const columnDefs = useMemo(() => getVariantDocumentColumnDefs(t), [t])
  const rows = useMemo(
    () =>
      documents.map((document) => ({
        document,
        version: getVariantDocumentVersion({document, releasesById, t}),
      })),
    [documents, releasesById, t],
  )

  return (
    <Card flex={1} ref={setScrollContainerRef} style={TABLE_CARD_STYLE}>
      <Table<VariantDocumentRow>
        columnDefs={columnDefs}
        data={rows}
        defaultSort={{column: 'documentGroup', direction: 'asc'}}
        emptyState={t('detail.documents.no-documents')}
        // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals
        rowId="document._id"
        scrollContainerRef={scrollContainerRef}
        searchFilter={filterDocuments}
      />
    </Card>
  )
}
