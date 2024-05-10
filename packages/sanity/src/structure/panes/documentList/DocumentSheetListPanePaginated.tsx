/* eslint-disable i18next/no-literal-string */
/* eslint-disable @sanity/i18n/no-attribute-string-literals */
/* eslint-disable react/jsx-no-bind */
import {type SchemaType} from '@sanity/types'
import {Box, Flex, Skeleton, Text} from '@sanity/ui'
import {flexRender, getCoreRowModel, type Row, useReactTable} from '@tanstack/react-table'
import {useVirtualizer, type VirtualItem} from '@tanstack/react-virtual'
import {useCallback, useEffect, useRef, useState} from 'react'
import {type SanityDocument, SearchProvider, useSchema, useSearchState} from 'sanity'
import {styled} from 'styled-components'

import {type BaseStructureToolPaneProps} from '../types'
import {ColumnsControl} from './ColumnsControl'
import {DocumentSheetFilter} from './DocumentSheetFilter'
import {DocumentSheetPaginator} from './DocumentSheetPaginator'
import {useDocumentSheetColumns} from './useDocumentSheetColumns'
import {useDocumentSheetListPaginated} from './useDocumentSheetListPaginated'

type DocumentSheetListPaneProps = BaseStructureToolPaneProps<'documentList'>

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

  td {
    padding: 0 3px;
  }
`

function DocumentSheetListPanePaginatedInner(
  props: DocumentSheetListPaneProps & {schemaType: SchemaType},
) {
  const schemaType = props.schemaType

  const searchState = useSearchState()
  const {dispatch, state} = searchState

  const columns = useDocumentSheetColumns(schemaType)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(5)
  const {data} = useDocumentSheetListPaginated({
    typeName: schemaType.name,
    page,
    pageSize,
  })

  const totalRows = state.result.hits.length
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const {rows} = table.getRowModel()

  //The virtualizer needs to know the scrollable container element
  const tableContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dispatch({type: 'TERMS_TYPE_ADD', schemaType: schemaType})
    return () => {
      dispatch({type: 'TERMS_TYPE_REMOVE', schemaType: schemaType})
    }
  }, [schemaType, dispatch])

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 44, //estimate row height for accurate scrollbar dragging
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
      const Component = row.original._options.ready ? Box : Skeleton
      return (
        <Component
          animated={!row.original._options.ready}
          as="tr"
          data-index={virtualRow.index} //needed for dynamic row height measurement
          ref={(node) => rowVirtualizer.measureElement(node)} //measure dynamic row height
          key={row.original._id + row.id}
          paddingY={1}
          style={{
            display: 'flex',
            position: 'absolute',
            transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
            width: '100%',
            minHeight: row.original._options.ready ? undefined : '44px',
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

  const totalPages = Math.ceil(totalRows / 25)
  return (
    <Box paddingX={3}>
      <DocumentSheetFilter />
      <Flex paddingBottom={3} paddingLeft={3}>
        <Text size={0} muted>
          Total: {totalRows} rows, showing {rows.length} rows
        </Text>
      </Flex>
      <ColumnsControl table={table} />
      <div
        ref={tableContainerRef}
        style={{
          overflow: 'auto', //our scrollable table container
          position: 'relative', //needed for sticky header
          height: '950px', //should be a fixed height - TODO: Calculate this based on the available space
        }}
      >
        <Table>
          <thead
            style={{
              display: 'grid',
              position: 'sticky',
              top: 0,
              zIndex: 1,
            }}
          >
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
              display: 'grid',
              height: `${rowVirtualizer.getTotalSize()}px`, //tells scrollbar how big the table is
              position: 'relative', //needed for absolute positioning of rows
            }}
          >
            {rowVirtualizer.getVirtualItems().map(renderRow)}
          </tbody>
        </Table>
      </div>
      <Flex justify={'flex-end'} padding={3}>
        <DocumentSheetPaginator page={page} totalPages={totalPages} setPage={setPage} />
      </Flex>
    </Box>
  )
}

export function DocumentSheetListPanePaginated(props: DocumentSheetListPaneProps) {
  const schema = useSchema()
  const typeName = props.pane.schemaTypeName

  const schemaType = schema.get(typeName)
  if (!schemaType) {
    throw new Error(`Schema type "${typeName}" not found`)
  }
  return (
    <SearchProvider>
      <DocumentSheetListPanePaginatedInner {...props} schemaType={schemaType} />
    </SearchProvider>
  )
}
