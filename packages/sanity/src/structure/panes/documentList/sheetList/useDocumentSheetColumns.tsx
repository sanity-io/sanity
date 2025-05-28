'use no memo'
// The `use no memo` directive is due to a known issue with react-table and react compiler: https://github.com/TanStack/table/issues/5567

import {isObjectSchemaType, type ObjectSchemaType} from '@sanity/types'
import {Box, Checkbox, Flex, Text} from '@sanity/ui'
import {
  type AccessorKeyColumnDef,
  createColumnHelper,
  type GroupColumnDef,
  type VisibilityState,
} from '@tanstack/react-table'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {
  type DocumentPreviewStore,
  DocumentStatusIndicator,
  getPreviewStateObservable,
  type SanityDocument,
  type SchemaType,
  useDocumentPreviewStore,
  useDocumentVersionInfo,
} from 'sanity'

import {DocumentSheetListSelect} from './DocumentSheetListSelect'
import {SheetListCellInner} from './SheetListCell'

export const VISIBLE_COLUMN_LIMIT = 5

const PreviewCell = (props: {
  documentPreviewStore: DocumentPreviewStore
  schemaType: SchemaType
  row: {
    original: SanityDocument
  }
}) => {
  const {documentPreviewStore, row, schemaType} = props
  const previewStateObservable = useMemo(
    () => getPreviewStateObservable(documentPreviewStore, schemaType, row.original._id),
    [documentPreviewStore, row.original._id, schemaType],
  )

  const versionsInfo = useDocumentVersionInfo(row.original._id)

  const {snapshot, isLoading} = useObservable(previewStateObservable, {
    snapshot: null,
    isLoading: true,
  })
  if (isLoading) {
    return (
      <Text size={1} muted>
        Loading...
      </Text>
    )
  }
  const displayValue = (snapshot?.title ?? 'Untitled') as string

  return (
    <Flex align="center" gap={3}>
      <DocumentStatusIndicator
        draft={versionsInfo.draft}
        published={versionsInfo.published}
        versions={undefined}
      />
      <Text size={1}>{displayValue}</Text>
    </Flex>
  )
}

const columnHelper = createColumnHelper<SanityDocument>()
const SUPPORTED_FIELDS = ['string', 'number', 'boolean']

type Columns = (
  | AccessorKeyColumnDef<SanityDocument, unknown>
  | GroupColumnDef<SanityDocument, unknown>
)[]

const getColsFromSchemaType = (schemaType: ObjectSchemaType, parentalField?: string): Columns => {
  return schemaType.fields.reduce<Columns>((tableColumns: Columns, field) => {
    const {type, name} = field
    if (SUPPORTED_FIELDS.includes(type.name)) {
      const nextCol = columnHelper.accessor(
        // accessor must use dot notation for internal tanstack method of reading cell data
        parentalField ? `${parentalField}.${field.name}` : field.name,
        {
          id: parentalField ? `${parentalField}_${field.name}` : field.name,
          header: field.type.title,
          enableHiding: true,
          cell: (info) => <SheetListCellInner {...info} fieldType={type} />,
        },
      )

      return [...tableColumns, nextCol]
    }

    // if first layer nested object
    if (type.name === 'object' && isObjectSchemaType(type) && !parentalField) {
      return [
        ...tableColumns,
        columnHelper.group({header: name, columns: getColsFromSchemaType(type, field.name)}),
      ]
    }

    return tableColumns
  }, [])
}

// Type guard function to check if a column is of type GroupColumnDef
function isAccessorKeyColumnDef(
  column: Columns[number],
): column is AccessorKeyColumnDef<SanityDocument, unknown> {
  return 'accessorKey' in column
}
function isGroupColumnDef(
  column: AccessorKeyColumnDef<SanityDocument, unknown> | GroupColumnDef<SanityDocument, unknown>,
): column is GroupColumnDef<SanityDocument, unknown> {
  return 'columns' in column
}

const flatColumns = (cols: Columns): AccessorKeyColumnDef<SanityDocument, unknown>[] => {
  return cols.flatMap((col) => {
    if (isAccessorKeyColumnDef(col)) {
      return col
    }
    if (isGroupColumnDef(col)) {
      return col.columns ? flatColumns(col.columns) : []
    }
    return []
  })
}

export function useDocumentSheetColumns(documentSchemaType?: ObjectSchemaType) {
  const documentPreviewStore = useDocumentPreviewStore()

  const columns: Columns = useMemo(() => {
    if (!documentSchemaType) {
      return []
    }
    return [
      columnHelper.display({
        id: 'selected',
        enableHiding: false,
        header: (info) => (
          <Box>
            <Checkbox
              style={{paddingLeft: 4}}
              indeterminate={info.table.getIsSomeRowsSelected()}
              onChange={info.table.getToggleAllPageRowsSelectedHandler()}
            />
            {/* eslint-disable-next-line i18next/no-literal-string */}
            {info.table.getSelectedRowModel().rows.length} selected
          </Box>
        ),
        cell: DocumentSheetListSelect,
      }),
      columnHelper.accessor('Preview', {
        enableHiding: false,
        id: 'Preview',
        cell: (info) => {
          return (
            <PreviewCell
              {...info}
              documentPreviewStore={documentPreviewStore}
              schemaType={documentSchemaType}
            />
          )
        },
      }),
      ...getColsFromSchemaType(documentSchemaType),
    ]
  }, [documentPreviewStore, documentSchemaType])

  const [initialColumnsVisibility]: [VisibilityState, number] = useMemo(
    () =>
      flatColumns(columns).reduce<[VisibilityState, number]>(
        ([accCols, countAllowedVisible], column) => {
          if (!column.id) throw new Error('Column must have an id')
          const visibilityKey = column.id

          // this column is always visible
          if (!column.enableHiding) {
            return [{...accCols, [visibilityKey]: true}, countAllowedVisible]
          }

          // have already reached column visibility limit, hide column by default
          if (countAllowedVisible === VISIBLE_COLUMN_LIMIT) {
            return [{...accCols, [visibilityKey]: false}, countAllowedVisible]
          }

          return [{...accCols, [visibilityKey]: true}, countAllowedVisible + 1]
        },
        [{}, 0],
      ),
    [columns],
  )

  return {columns, initialColumnsVisibility}
}
