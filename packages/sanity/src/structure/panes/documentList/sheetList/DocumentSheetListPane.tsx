import {isDocumentSchemaType, type ObjectSchemaType, type SanityDocument} from '@sanity/types'
import {Box, Flex, Text} from '@sanity/ui'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type Row,
  useReactTable,
} from '@tanstack/react-table'
import {useCallback, useEffect, useState} from 'react'
import {SearchProvider, useSchema, useSearchState} from 'sanity'
import {styled} from 'styled-components'

import {type BaseStructureToolPaneProps} from '../../types'
import {ColumnsControl} from './ColumnsControl'
import {DocumentSheetListFilter} from './DocumentSheetListFilter'
import {DocumentSheetListHeader} from './DocumentSheetListHeader'
import {DocumentSheetListPaginator} from './DocumentSheetListPaginator'
import {DocumentSheetListProvider} from './DocumentSheetListProvider'
import {useDocumentSheetColumns} from './useDocumentSheetColumns'
import {useDocumentSheetList} from './useDocumentSheetList'

type DocumentSheetListPaneProps = BaseStructureToolPaneProps<'documentList'>

const PaneContainer = styled(Flex)`
  height: 100%;
`
const TableContainer = styled.div`
  overflow: auto; //our scrollable table container
  position: relative; //needed for sticky header
`
const Table = styled.table`
  border-collapse: separate;
  border-spacing: 0;
  font-family: arial, sans-serif;
  white-space: nowrap;
  width: 100%;
  border: 1px solid lightgray;

  thead {
    display: grid;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  tr {
    padding: 0;
  }
  tr:last-child {
    border-bottom: none;
  }
`

const DataCell = styled.td<{width: number}>`
  display: flex;
  overflow: hidden;
  box-sizing: border-box;
  padding: 22px 16px;
  width: ${({width}) => width}px;
  border-top: 1px solid var(--card-border-color);
  background-color: white;
`

const PinnedDataCell = styled(DataCell)`
  position: sticky;
  z-index: 2;
`

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
        as="tr"
        key={row.original._id + row.id}
        paddingY={2}
        style={{display: 'flex', width: '100%'}}
      >
        {row.getVisibleCells().map((cell) => {
          const isPinned = cell.column.getIsPinned()
          const Row = isPinned ? PinnedDataCell : DataCell
          const borderWidth = isPinned && cell.column.getIsLastColumn('left') ? 2 : 1

          return (
            <Row
              key={row.original._id + cell.id}
              style={{
                left: cell.column.getStart('left') ?? undefined,
                borderRight: `${borderWidth}px solid var(--card-border-color)`,
              }}
              width={cell.column.getSize()}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </Row>
          )
        })}
      </Box>
    )
  }, [])

  const rowsCount = `Total: ${totalRows} rows, showing ${rows.length} rows`
  return (
    <PaneContainer direction="column" paddingX={3} data-testid="document-sheet-list-pane">
      <Flex direction="row" align="center" paddingY={3} paddingX={1} justify="space-between">
        <Flex direction="row" align="center">
          <DocumentSheetListFilter />
          <Text size={0} muted>
            {rowsCount}
          </Text>
        </Flex>
        <ColumnsControl table={table} />
      </Flex>
      <TableContainer>
        <DocumentSheetListProvider table={table}>
          <Table>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <Box as="tr" key={headerGroup.id}>
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
          </Table>
        </DocumentSheetListProvider>
      </TableContainer>
      <Flex justify={'flex-end'} padding={3} gap={4} paddingY={5}>
        <DocumentSheetListPaginator table={table} />
      </Flex>
    </PaneContainer>
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
