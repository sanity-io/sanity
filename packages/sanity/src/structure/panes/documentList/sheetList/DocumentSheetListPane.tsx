import {isDocumentSchemaType, type ObjectSchemaType, type SanityDocument} from '@sanity/types'
import {Box, Flex, Text} from '@sanity/ui'
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type Row,
  useReactTable,
} from '@tanstack/react-table'
import {useCallback, useEffect, useState} from 'react'
import {SearchProvider, useSchema, useSearchState} from 'sanity'

import {type BaseStructureToolPaneProps} from '../../types'
import {paneContainer, tableContainer, table} from './DocumentSheetListPane.css'
import {ColumnsControl} from './ColumnsControl'
import {DocumentSheetListFilter} from './DocumentSheetListFilter'
import {DocumentSheetListHeader} from './DocumentSheetListHeader'
import {DocumentSheetListPaginator} from './DocumentSheetListPaginator'
import {DocumentSheetListProvider} from './DocumentSheetListProvider'
import {SheetListCell} from './SheetListCell'
import {useDocumentSheetColumns} from './useDocumentSheetColumns'
import {useDocumentSheetList} from './useDocumentSheetList'

type DocumentSheetListPaneProps = BaseStructureToolPaneProps<'documentList'>


function DocumentSheetListPaneInner({
  documentSchemaType,
}: DocumentSheetListPaneProps & {documentSchemaType: ObjectSchemaType}) {
  const {dispatch, state} = useSearchState()
  const {columns, initialColumnsVisibility} = useDocumentSheetColumns(documentSchemaType)
  const {data} = useDocumentSheetList({
    typeName: documentSchemaType.name,
  })
  const [selectedAnchor, setSelectedAnchor] = useState<number | null>(null)

  const totalRows = state.result.hits.length
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // Avoids resetting the page index when the data changes, e.g. a mutation is received
    autoResetPageIndex: false,
    initialState: {
      columnPinning: {left: ['selected', 'Preview']},
      pagination: {pageSize: 25},
      columnVisibility: initialColumnsVisibility,
    },
    getRowId: (row) => row._id,
    meta: {
      selectedAnchor,
      setSelectedAnchor,
      patchDocument: (documentId, fieldId, value) => null,
    },
  })

  const {rows} = table.getRowModel()

  useEffect(() => {
    dispatch({type: 'TERMS_TYPE_ADD', schemaType: documentSchemaType})
    return () => {
      dispatch({type: 'TERMS_TYPE_REMOVE', schemaType: documentSchemaType})
    }
  }, [documentSchemaType, dispatch])

  const renderRow = useCallback((row: Row<SanityDocument>) => {
    return (
      <Box
        key={row.original._id + row.id}
        as="tr"
        paddingY={2}
        style={{display: 'flex', width: '100%'}}
      >
        {row.getVisibleCells().map((cell) => (
          <SheetListCell key={row.original._id + cell.id} {...cell} />
        ))}
      </Box>
    )
  }, [])

  const rowsCount = `Total: ${totalRows} rows, showing ${rows.length} rows`
  return (
    <Flex className={paneContainer} direction="column" paddingX={3} data-testid="document-sheet-list-pane">
      <Flex direction="row" align="center" paddingY={3} paddingX={1} justify="space-between">
        <Flex direction="row" align="center">
          <DocumentSheetListFilter />
          <Text size={0} muted>
            {rowsCount}
          </Text>
        </Flex>
        <ColumnsControl table={table} />
      </Flex>
      <div className={tableContainer}>
        <DocumentSheetListProvider table={table}>
          <table className={table}>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <Box key={headerGroup.id} as="tr">
                  {headerGroup.headers.map((header) => (
                    <DocumentSheetListHeader
                      key={header.id}
                      header={header}
                      headerGroup={headerGroup}
                    />
                  ))}
                </Box>
              ))}
            </thead>
            <tbody>{table.getRowModel().rows.map(renderRow)}</tbody>
          </table>
        </DocumentSheetListProvider>
      </div>
      <Flex justify={'flex-end'} padding={3} gap={4} paddingY={5}>
        <DocumentSheetListPaginator table={table} />
      </Flex>
    </Flex>
  )
}

export function DocumentSheetListPane(props: DocumentSheetListPaneProps) {
  const schema = useSchema()
  const typeName = props.pane.schemaTypeName

  const schemaType = schema.get(typeName)
  if (!schemaType || !isDocumentSchemaType(schemaType)) {
    throw new Error(`Schema type "${typeName}" not found or not a document schema`)
  }
  return (
    <SearchProvider>
      <DocumentSheetListPaneInner {...props} documentSchemaType={schemaType} />
    </SearchProvider>
  )
}
