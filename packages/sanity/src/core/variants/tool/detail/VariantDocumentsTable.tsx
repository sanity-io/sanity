import {type SanityDocument} from '@sanity/client'
import {Box, Card, Flex, Text} from '@sanity/ui'
import {type CSSProperties, memo, useMemo, useState} from 'react'

import {RelativeTime} from '../../../components/RelativeTime'
import {useSchema} from '../../../hooks'
import {type UseTranslationResponse, useTranslation} from '../../../i18n'
import {SanityDefaultPreview} from '../../../preview/components/SanityDefaultPreview'
import {Table} from '../../../releases/tool/components/Table/Table'
import {Headers} from '../../../releases/tool/components/Table/TableHeader'
import {type Column} from '../../../releases/tool/components/Table/types'
import {variantsLocaleNamespace} from '../../i18n'

interface VariantDocumentRow {
  document: SanityDocument
}

const TABLE_CARD_STYLE: CSSProperties = {
  height: 320,
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

function getVariantDocumentColumnDefs(
  t: UseTranslationResponse<'variants', undefined>['t'],
): Column<VariantDocumentRow>[] {
  return [
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
      cell: ({cellProps}) => (
        <Flex align="center" {...cellProps}>
          <Box paddingX={2}>
            <Text muted size={1}>
              -
            </Text>
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
  const columnDefs = useMemo(() => getVariantDocumentColumnDefs(t), [t])
  const rows = useMemo(() => documents.map((document) => ({document})), [documents])

  return (
    <Card ref={setScrollContainerRef} style={TABLE_CARD_STYLE}>
      <Table<VariantDocumentRow>
        columnDefs={columnDefs}
        data={rows}
        defaultSort={{column: 'search', direction: 'asc'}}
        emptyState={t('detail.documents.no-documents')}
        // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
        rowId="document._id"
        scrollContainerRef={scrollContainerRef}
        searchFilter={filterDocuments}
      />
    </Card>
  )
}
