import {
  isBooleanSchemaType,
  isNumberSchemaType,
  isObjectSchemaType,
  isPrimitiveSchemaType,
  isStringSchemaType,
  type ObjectSchemaType,
} from '@sanity/types'
import {Checkbox, Flex} from '@sanity/ui'
import {
  type AccessorKeyColumnDef,
  createColumnHelper,
  type GroupColumnDef,
  type VisibilityState,
} from '@tanstack/react-table'
import {useMemo} from 'react'
import {useTranslation} from 'sanity'

import {DocumentSheetListSelect} from './DocumentSheetListSelect'
import {PreviewCell} from './DocumentSheetPreviewCell'
import {BooleanCellInput} from './fields/BooleanCellInput'
import {CellInput} from './fields/CellInput'
import {DropdownCellInput, shouldDropdownRender} from './fields/DropdownCellInput'
import {SheetListLocaleNamespace} from './i18n'
import {type DocumentSheetTableRow} from './types'

export const VISIBLE_COLUMN_LIMIT = 5

const columnHelper = createColumnHelper<DocumentSheetTableRow>()

type Columns = (
  | AccessorKeyColumnDef<DocumentSheetTableRow, unknown>
  | GroupColumnDef<DocumentSheetTableRow, unknown>
)[]

const getColsFromSchemaType = (schemaType: ObjectSchemaType, parentalField?: string): Columns => {
  return schemaType.fields.reduce<Columns>((tableColumns: Columns, field) => {
    const {type: fieldType, name} = field
    if (isPrimitiveSchemaType(fieldType)) {
      const nextCol = columnHelper.accessor(
        // accessor must use dot notation for internal tanstack method of reading cell data
        parentalField ? `${parentalField}.${field.name}` : field.name,
        {
          id: parentalField ? `${parentalField}_${field.name}` : field.name,
          header: field.type.title,
          enableHiding: true,
          meta: {
            fieldType,
          },
          cell: (info) => {
            if (isNumberSchemaType(fieldType) || isStringSchemaType(fieldType)) {
              if (shouldDropdownRender(fieldType))
                return <DropdownCellInput {...info} fieldType={fieldType} />

              return <CellInput {...info} fieldType={fieldType} />
            }

            if (isBooleanSchemaType(fieldType)) {
              return <BooleanCellInput {...info} fieldType={fieldType} />
            }

            return null
          },
        },
      )

      return [...tableColumns, nextCol]
    }

    // if first layer nested object
    if (fieldType.name === 'object' && isObjectSchemaType(fieldType) && !parentalField) {
      return [
        ...tableColumns,
        columnHelper.group({header: name, columns: getColsFromSchemaType(fieldType, field.name)}),
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
  const {t} = useTranslation(SheetListLocaleNamespace)

  const columns: Columns = useMemo(() => {
    if (!documentSchemaType) {
      return []
    }
    return [
      columnHelper.display({
        id: 'selected',
        enableHiding: false,
        size: 53,
        meta: {
          customHeader: true,
          borderWidth: 0,
          disableCellFocus: true,
        },
        header: (info) => {
          if (info.header.depth > 1) return null
          return (
            <Flex justify="center">
              <Checkbox
                indeterminate={info.table.getIsSomeRowsSelected()}
                onChange={info.table.getToggleAllPageRowsSelectedHandler()}
              />
            </Flex>
          )
        },
        cell: DocumentSheetListSelect,
      }),
      columnHelper.accessor(t('preview-header'), {
        enableHiding: false,
        size: 320,
        id: 'Preview',
        meta: {
          disableCellFocus: true,
        },
        cell: (info) => {
          return <PreviewCell {...info} schemaType={documentSchemaType} />
        },
      }),
      ...getColsFromSchemaType(documentSchemaType),
    ]
  }, [documentSchemaType, t])

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
