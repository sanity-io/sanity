import {Card} from '@sanity/ui'
import {type CSSProperties, useMemo, useState} from 'react'

import {useTranslation} from '../../../i18n'
import {Table} from '../../../releases/tool/components/Table/Table'
import {type Column} from '../../../releases/tool/components/Table/types'
import {searchDocumentRelease} from '../../../releases/tool/detail/documentTable/searchDocumentRelease'
import {variantsLocaleNamespace} from '../../i18n'
import {type DocumentInVariantGroup} from './types'
import {getVariantDocumentTableColumnDefs} from './variantDocumentTable/VariantDocumentTableColumnDefs'

const TABLE_CARD_STYLE: CSSProperties = {
  height: '100%',
  overflow: 'auto',
}

function filterDocuments(
  rows: DocumentInVariantGroup[],
  searchTerm: string,
): DocumentInVariantGroup[] {
  if (!searchTerm.trim()) {
    return rows
  }

  return rows.filter(({document}) => searchDocumentRelease(document, searchTerm))
}

export function VariantDocumentsTable({
  rows,
  loading = false,
  variantId,
}: {
  rows: DocumentInVariantGroup[]
  loading?: boolean
  variantId?: string
}): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)
  const [scrollContainerRef, setScrollContainerRef] = useState<HTMLDivElement | null>(null)
  const columnDefs = useMemo<Column<DocumentInVariantGroup>[]>(
    () => getVariantDocumentTableColumnDefs(t, variantId),
    [t, variantId],
  )

  return (
    <Card flex={1} ref={setScrollContainerRef} style={TABLE_CARD_STYLE}>
      <Table<DocumentInVariantGroup>
        columnDefs={columnDefs}
        data={rows}
        defaultSort={{column: 'documentGroup', direction: 'asc'}}
        emptyState={t('detail.documents.no-documents')}
        loading={loading}
        // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals
        rowId="groupId"
        scrollContainerRef={scrollContainerRef}
        searchFilter={filterDocuments}
      />
    </Card>
  )
}
