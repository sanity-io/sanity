import {type SanityDocument} from '@sanity/migrate'
import {
  flexRender,
  getCoreRowModel,
  type Row,
  type RowData,
  useReactTable,
} from '@tanstack/react-table'
import {useVirtualizer} from '@tanstack/react-virtual'
import {useMemo, useRef} from 'react'
import {useMemoObservable} from 'react-rx'
import {combineLatest} from 'rxjs'
import {getPublishedId, LoadingBlock, useDocumentStore, useSchema, useUnique} from 'sanity'
import {styled} from 'styled-components'

import {type BaseStructureToolPaneProps} from '../types'
import {EMPTY_RECORD} from './constants'
import {applyOrderingFunctions} from './helpers'
import {useShallowUnique} from './PaneContainer'
import {type SortOrder} from './types'
import {useDocumentList} from './useDocumentList'
import {useDocumentSheetColumns} from './useDocumentSheetColumns'
import {useDocumentSheetListStore} from './useDocumentSheetListStore'

type DocumentSheetListPaneProps = BaseStructureToolPaneProps<'documentList'> & {
  sortOrder?: SortOrder
}

function useEditStateList(publishedDocIds: string[], docTypeName: string): EditStateFor[] {
  const documentStore = useDocumentStore()
  return useMemoObservable(() => {
    return combineLatest(
      publishedDocIds.map((publishedDocId) =>
        documentStore.pair.editState(publishedDocId, docTypeName),
      ),
    )
  }, [documentStore.pair, publishedDocIds, docTypeName]) as EditStateFor[]
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

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void
  }
}

export function DocumentSheetListPane(props: DocumentSheetListPaneProps) {
  console.log('props', props)
  const typeName = props.pane.schemaTypeName
  const sortOrderRaw = props.sortOrder
  const schema = useSchema()
  const schemaType = schema.get(typeName)
  const columns = useDocumentSheetColumns(schemaType)
  const sortWithOrderingFn =
    typeName && sortOrderRaw
      ? applyOrderingFunctions(sortOrderRaw, schema.get(typeName) as any)
      : sortOrderRaw

  const sortOrder = useUnique(sortWithOrderingFn)

  const params = useShallowUnique(props.pane.options.params || EMPTY_RECORD)

  const {data, isLoading} = useDocumentSheetListStore({
    filter: props.pane.options.filter,
    params: props.pane.options.params,
    apiVersion: props.pane.options.apiVersion,
  })
  const {
    error,
    hasMaxItems,
    isLazyLoading,
    isLoading: documentListLoading,
    isSearchReady,
    items,
    onListChange,
    onRetry,
  } = useDocumentList({
    apiVersion: props.pane.options.apiVersion,
    filter: props.pane.options.filter,
    params,
    searchQuery: '',
    sortOrder,
  })
  const list = useMemo(() => items.map((i) => getPublishedId(i._id)), [])
  console.log('DATA', data)
  const edits = useEditStateList(list, typeName)
  console.log('EDITS', edits)
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const {rows} = table.getRowModel()

  //The virtualizer needs to know the scrollable container element
  const tableContainerRef = useRef<HTMLDivElement>(null)

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

  if (isLoading) {
    return <LoadingBlock />
  }
  if (!data.length) {
    // eslint-disable-next-line i18next/no-literal-string
    return <div>No items</div>
  }
  return (
    <>
      ({rows.length} rows)
      <div
        ref={tableContainerRef}
        style={{
          overflow: 'auto', //our scrollable table container
          position: 'relative', //needed for sticky header
          height: '1500px', //should be a fixed height
        }}
      >
        <Table>
          {/* <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead> */}
          {/* <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} style={{whiteSpace: 'nowrap'}}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  <Box padding={1}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</Box>
                </td>
              ))}
            </tr>
          ))}
        </tbody> */}
          <thead
            style={{
              display: 'grid',
              position: 'sticky',
              top: 0,
              zIndex: 1,
            }}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} style={{display: 'flex', width: '100%'}}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th
                      key={header.id}
                      style={{
                        display: 'flex',
                        width: header.getSize(),
                      }}
                    >
                      <div
                        {...{
                          className: header.column.getCanSort() ? 'cursor-pointer select-none' : '',
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: ' 🔼',
                          desc: ' 🔽',
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody
            style={{
              display: 'grid',
              height: `${rowVirtualizer.getTotalSize()}px`, //tells scrollbar how big the table is
              position: 'relative', //needed for absolute positioning of rows
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index] as Row<SanityDocument>
              return (
                <tr
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
                </tr>
              )
            })}
          </tbody>
        </Table>
      </div>
    </>
  )
}
