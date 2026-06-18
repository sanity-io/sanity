import {Card} from '@sanity/ui'
import {type CSSProperties, useMemo, useState} from 'react'

import {useTranslation} from '../../../i18n'
import {Table} from '../../../releases/tool/components/Table/Table'
import {type Column} from '../../../releases/tool/components/Table/types'
import {variantsLocaleNamespace} from '../../i18n'
import {type DocumentInVariantGroup} from './types'
import {getVariantDocumentTableColumnDefs} from './variantDocumentTable/VariantDocumentTableColumnDefs'

const TABLE_CARD_STYLE: CSSProperties = {
  height: '100%',
  overflow: 'auto',
}

function getDocumentPreviewTitle(document: DocumentInVariantGroup['document']): string {
  const title = document.title || document.name

  return typeof title === 'string' && title.trim() ? title : document._id
}

function filterDocuments(
  rows: DocumentInVariantGroup[],
  searchTerm: string,
): DocumentInVariantGroup[] {
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
  rows,
  loading = false,
}: {
  rows: DocumentInVariantGroup[]
  loading?: boolean
}): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)
  const [scrollContainerRef, setScrollContainerRef] = useState<HTMLDivElement | null>(null)
  const columnDefs = useMemo<Column<DocumentInVariantGroup>[]>(
    () => getVariantDocumentTableColumnDefs(t),
    [t],
  )

  return (
    <Card flex={1} ref={setScrollContainerRef} style={TABLE_CARD_STYLE}>
      <Table<DocumentInVariantGroup>
        columnDefs={columnDefs}
        data={rows}
        defaultSort={{column: 'search', direction: 'asc'}}
        emptyState={t('detail.documents.no-documents')}
        loading={loading}
        // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
        rowId="groupId"
        scrollContainerRef={scrollContainerRef}
        searchFilter={filterDocuments}
      />
    </Card>
  )
}
