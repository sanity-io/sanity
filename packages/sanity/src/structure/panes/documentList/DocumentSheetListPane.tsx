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
import {useCallback, useEffect} from 'react'
import {SearchProvider, useSchema, useSearchState} from 'sanity'
import {styled} from 'styled-components'

import {type BaseStructureToolPaneProps} from '../types'
import {ColumnsControl} from './ColumnsControl'
import {DocumentSheetListFilter} from './DocumentSheetListFilter'
import {DocumentSheetListPaginator} from './DocumentSheetListPaginator'
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
  border-collapse: collapse;
  border-spacing: 0;
  font-family: arial, sans-serif;
  table-layout: fixed;
  white-space: nowrap;
  width: 100%;
  border: 1px solid lightgray;

  thead {
    background: lightgray;
    display: grid;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  tr {
    border-bottom: 1px solid lightgray;
    display: flex;
    padding: 0;
  }
  tr:last-child {
    border-bottom: none;
  }
  th {
    border-bottom: 1px solid lightgray;
    border-right: 1px solid lightgray;
    padding: 2px 4px;
    text-align: left;
  }

  td {
    padding: 0;
  }
`

function DocumentSheetListPaneInner({
  documentSchemaType,
}: DocumentSheetListPaneProps & {documentSchemaType: ObjectSchemaType}) {
  const {dispatch, state} = useSearchState()
  const {columns, initialColumnsVisibility} = useDocumentSheetColumns(documentSchemaType)
  const {data} = useDocumentSheetList({
    typeName: documentSchemaType.name,
  })

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
      pagination: {pageSize: 25},
      columnVisibility: initialColumnsVisibility,
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
          return (
            <td
              key={row.original._id + cell.id}
              style={{
                display: 'flex',
                overflow: 'hidden',
                width: cell.column.getSize(),
              }}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          )
        })}
      </Box>
    )
  }, [])

  const rowsCount = `Total: ${totalRows} rows, showing ${rows.length} rows`
  return (
    <PaneContainer direction="column" paddingX={3} data-testid="document-sheet-list-pane">
      <DocumentSheetListFilter />
      <Flex paddingBottom={3} paddingLeft={3}>
        <Text size={0} muted>
          {rowsCount}
        </Text>
      </Flex>
      <TableContainer>
        <ColumnsControl table={table} />
        <Table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Box
                as="tr"
                key={headerGroup.id}
                style={{display: 'flex', width: '100%'}}
                paddingY={1}
              >
                {headerGroup.headers.map((header) => (
                  <th key={header.id} style={{display: 'flex', width: header.getSize()}}>
                    {headerGroup.depth > 0 && !header.column.parent ? null : (
                      <div>{flexRender(header.column.columnDef.header, header.getContext())}</div>
                    )}
                  </th>
                ))}
              </Box>
            ))}
          </thead>
          <tbody>{table.getRowModel().rows.map(renderRow)}</tbody>
        </Table>
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
