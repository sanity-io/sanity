import {Box, Skeleton, Text} from '@sanity/ui'
import {flexRender, getCoreRowModel, type Row, useReactTable} from '@tanstack/react-table'
import {useVirtualizer, type VirtualItem} from '@tanstack/react-virtual'
import {useCallback, useRef} from 'react'
import {LoadingBlock, type SanityDocument, useSchema} from 'sanity'
import {styled} from 'styled-components'

import {type BaseStructureToolPaneProps} from '../types'
import {type SortOrder} from './types'
import {useDocumentSheetColumns} from './useDocumentSheetColumns'
import {useDocumentSheetList} from './useDocumentSheetList'

type DocumentSheetListPaneProps = BaseStructureToolPaneProps<'documentList'> & {
  sortOrder?: SortOrder
}

const Table = styled.table`
  border-collapse: collapse;
  border-spacing: 0;
  font-family: arial, sans-serif;
  table-layout: fixed;
  white-space: nowrap;
  width: 100%;
  thead {
    background: lightgray;
  }
  tr {
    border-bottom: 1px solid lightgray;
  }
  th {
    border-bottom: 1px solid lightgray;
    border-right: 1px solid lightgray;
    padding: 2px 4px;
    text-align: left;
  }

  td {
    padding: 6px;
  }
`

export function DocumentSheetListPane(props: DocumentSheetListPaneProps) {
  const typeName = props.pane.schemaTypeName
  const sortOrderRaw = props.sortOrder
  const schema = useSchema()
  const schemaType = schema.get(typeName)
  if (!schemaType) {
    throw new Error(`Schema type "${typeName}" not found`)
  }
  const columns = useDocumentSheetColumns(schemaType)
  const {
    data: dataRaw,
    isLoading,
    onListChange,
    isLazyLoading,
  } = useDocumentSheetList({
    schemaType,
    sortOrder: sortOrderRaw,
    paneOptions: props.pane.options,
  })
  const data = dataRaw.slice(0, 1)
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const {rows} = table.getRowModel()

  //The virtualizer needs to know the scrollable container element
  const tableContainerRef = useRef<HTMLDivElement>(null)

  const handleEndReached = useCallback(() => {
    if (isLoading || isLazyLoading) return

    onListChange()
  }, [isLazyLoading, isLoading, onListChange])

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 24, //estimate row height for accurate scrollbar dragging
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
      const isLast = virtualRow.index === rows.length - 1
      // If is last row, trigger the next page call
      if (isLast) {
        handleEndReached()
      }
      const Component = row.original._options.ready ? Box : Skeleton
      return (
        <>
          <Component
            animated={!row.original._options.ready}
            as="tr"
            paddingY={1}
            data-index={virtualRow.index} //needed for dynamic row height measurement
            ref={(node) => rowVirtualizer.measureElement(node)} //measure dynamic row height
            key={row.id}
            style={{
              display: 'flex',
              position: 'absolute',
              transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
              width: '100%',
            }}
          >
            {row.getVisibleCells().map((cell) => {
              return (
                <td
                  key={cell.id}
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
          {isLast && isLazyLoading && <LoadingBlock />}
        </>
      )
    },
    [rowVirtualizer, rows, handleEndReached, isLazyLoading],
  )

  if (isLoading) {
    return <LoadingBlock />
  }
  if (!data.length) {
    // eslint-disable-next-line i18next/no-literal-string
    return <div>No items</div>
  }

  return (
    <Box paddingX={3}>
      <Box paddingBottom={3}>
        <Text size={0} muted>
          {/* eslint-disable-next-line i18next/no-literal-string */}
          {rows.length} rows
        </Text>
      </Box>
      <div
        ref={tableContainerRef}
        style={{
          overflow: 'auto', //our scrollable table container
          position: 'relative', //needed for sticky header
          height: '1500px', //should be a fixed height
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
                {headerGroup.headers.map((header) => {
                  return (
                    <th
                      key={header.id}
                      style={{
                        display: 'flex',
                        width: header.getSize(),
                        padding: 'unset',
                        borderRight: 'unset',
                        overflow: 'hidden',
                      }}
                    >
                      {headerGroup.depth > 0 && !header.column.parent ? null : (
                        <div>{flexRender(header.column.columnDef.header, header.getContext())}</div>
                      )}
                    </th>
                  )
                })}
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
    </Box>
  )
}
