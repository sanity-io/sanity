import {type SanityDocument, type SchemaType} from '@sanity/types'
import {Box, Flex, Skeleton, Text} from '@sanity/ui'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  type Row,
  useReactTable,
} from '@tanstack/react-table'
import {useVirtualizer, type VirtualItem} from '@tanstack/react-virtual'
import {useCallback, useEffect, useRef} from 'react'
import {SearchProvider, useSchema, useSearchState} from 'sanity'
import {styled} from 'styled-components'

import {type BaseStructureToolPaneProps} from '../types'
import {DocumentSheetFilter} from './DocumentSheetListFilter'
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

  tbody {
    position: relative;
    display: 'grid';
  }

  td {
    padding: 0 3px;
  }
`

function DocumentSheetListPaneInner({
  schemaType,
}: DocumentSheetListPaneProps & {schemaType: SchemaType}) {
  const {dispatch, state} = useSearchState()
  const columns = useDocumentSheetColumns(schemaType)
  const {data} = useDocumentSheetList({
    typeName: schemaType.name,
  })
  const tableContainerRef = useRef<HTMLDivElement>(null)

  const totalRows = state.result.hits.length
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // Avoids resetting the page index when the data changes, e.g. a mutation is received
    autoResetPageIndex: false,
  })

  const {rows} = table.getRowModel()

  useEffect(() => {
    dispatch({type: 'TERMS_TYPE_ADD', schemaType: schemaType})
    return () => {
      dispatch({type: 'TERMS_TYPE_REMOVE', schemaType: schemaType})
    }
  }, [schemaType, dispatch])

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 26, //estimate row height for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    //measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5,
  })

  const renderRow = useCallback(
    (virtualRow: VirtualItem) => {
      const row = rows[virtualRow.index] as Row<SanityDocument>
      const Component = row.original._loading ? Skeleton : Box
      return (
        <Component
          animated
          as="tr"
          key={row.original._id + row.id}
          paddingY={2}
          data-index={virtualRow.index} //needed for dynamic row height measurement
          ref={(node) => rowVirtualizer.measureElement(node)} //measure dynamic row height
          style={{
            display: 'flex',
            position: 'absolute',
            transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
            width: '100%',
            minHeight: row.original._loading ? '26px' : undefined,
          }}
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
        </Component>
      )
    },
    [rowVirtualizer, rows],
  )

  const rowsCount = `Total: ${totalRows} rows, showing ${rows.length} rows`
  return (
    <PaneContainer direction="column" paddingX={3} data-testid="document-sheet-list-pane">
      <DocumentSheetFilter />
      <Flex paddingBottom={3} paddingLeft={3}>
        <Text size={0} muted>
          {rowsCount}
        </Text>
      </Flex>
      <TableContainer
        ref={tableContainerRef}
        style={{
          height: '800px', //should be a fixed height - TODO: make it dynamic based on the parent container
        }}
      >
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
          <tbody
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`, //tells scrollbar how big the table is
            }}
          >
            {rowVirtualizer.getVirtualItems().map(renderRow)}
          </tbody>
        </Table>
      </TableContainer>
    </PaneContainer>
  )
}

export function DocumentSheetListPane(props: DocumentSheetListPaneProps) {
  const schema = useSchema()
  const typeName = props.pane.schemaTypeName

  const schemaType = schema.get(typeName)
  if (!schemaType) {
    throw new Error(`Schema type "${typeName}" not found`)
  }
  return (
    <SearchProvider>
      <DocumentSheetListPaneInner {...props} schemaType={schemaType} />
    </SearchProvider>
  )
}
