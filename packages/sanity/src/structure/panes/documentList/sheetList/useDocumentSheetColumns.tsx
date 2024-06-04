import {ErrorOutlineIcon} from '@sanity/icons'
import {isObjectSchemaType, type ObjectSchemaType} from '@sanity/types'
import {Box, Checkbox, Flex, Stack, Text, Tooltip} from '@sanity/ui'
import {
  type AccessorKeyColumnDef,
  createColumnHelper,
  type GroupColumnDef,
  type VisibilityState,
} from '@tanstack/react-table'
import {useMemo} from 'react'
import {useMemoObservable} from 'react-rx'
import {
  type DocumentPreviewStore,
  DocumentStatusIndicator,
  getPreviewStateObservable,
  useDocumentPreviewStore,
} from 'sanity'

import {useValidationMarkers} from '../../../../core/form/studio/contexts/Validation'
import {type PaneItemPreviewState} from '../../../components/paneItem/types'
import {ValidationCard} from '../../document/inspectors/validation/ValidationInspector'
import {DocumentSheetListSelect} from './DocumentSheetListSelect'
import {SheetListCellInner} from './SheetListCell'
import {type DocumentSheetTableRow} from './types'

export const VISIBLE_COLUMN_LIMIT = 5

const RowValidation = ({
  value,
  schemaType,
}: {
  value: DocumentSheetTableRow
  schemaType: ObjectSchemaType
}) => {
  const validation = useValidationMarkers()
  if (validation.length === 0) {
    return null
  }
  return (
    <Tooltip
      content={
        <Stack space={2} paddingY={2}>
          {validation.map((marker) => (
            <ValidationCard
              key={marker.path.join('.')}
              marker={marker}
              schemaType={schemaType}
              value={value}
            />
          ))}
        </Stack>
      }
    >
      <ErrorOutlineIcon />
    </Tooltip>
  )
}
const PreviewCell = (props: {
  documentPreviewStore: DocumentPreviewStore
  schemaType: ObjectSchemaType
  row: {
    original: DocumentSheetTableRow
  }
}) => {
  const {documentPreviewStore, row, schemaType} = props
  const title = 'Document title'
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const {draft, published, isLoading} = useMemoObservable<PaneItemPreviewState>(
    () => getPreviewStateObservable(documentPreviewStore, schemaType, row.original._id, title),
    [documentPreviewStore, schemaType, row.original._id],
  )!
  if (isLoading) {
    return (
      <Text size={1} muted>
        Loading...
      </Text>
    )
  }
  const displayValue = (draft?.title ?? published?.title ?? 'Untitled') as string
  return (
    <Flex align="center" gap={3}>
      <DocumentStatusIndicator draft={draft} published={published} />
      <Text size={1}>{displayValue}</Text>
      <RowValidation schemaType={schemaType} value={row.original} />
    </Flex>
  )
}

const columnHelper = createColumnHelper<DocumentSheetTableRow>()
const SUPPORTED_FIELDS = ['string', 'number', 'boolean']

type Columns = (
  | AccessorKeyColumnDef<DocumentSheetTableRow, unknown>
  | GroupColumnDef<DocumentSheetTableRow, unknown>
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
): column is AccessorKeyColumnDef<DocumentSheetTableRow, unknown> {
  return 'accessorKey' in column
}
function isGroupColumnDef(
  column:
    | AccessorKeyColumnDef<DocumentSheetTableRow, unknown>
    | GroupColumnDef<DocumentSheetTableRow, unknown>,
): column is GroupColumnDef<DocumentSheetTableRow, unknown> {
  return 'columns' in column
}

const flatColumns = (cols: Columns): AccessorKeyColumnDef<DocumentSheetTableRow, unknown>[] => {
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
