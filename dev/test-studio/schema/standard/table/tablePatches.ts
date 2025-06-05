import {uuid} from '@sanity/uuid'
import {type FieldDefinition, type FormPatch, insert, unset} from 'sanity'

import {type Cell, type Column, type DataRow, type HeaderRow} from './types'

export function getInsertTablePatch(
  headerRow: HeaderRow | undefined,
  cellType: FieldDefinition,
): FormPatch[] {
  const headerRowKey = headerRow?._key || uuid()

  const patches: FormPatch[] = [
    insert(
      [
        {
          _type: 'header',
          _key: uuid(),
          dataKey: `${cellType.type}-${uuid().slice(0, 4)}`,
          dataType: cellType.name,
          title: `${cellType.title || cellType.name}`,
        } satisfies Column,
      ],
      'after',
      ['rows', {_key: headerRowKey}, 'columns', -1],
    ),
  ]
  if (!headerRow) {
    patches.unshift(
      insert([{_type: 'headerRow', _key: headerRowKey, columns: []}], 'after', ['rows', -1]),
    )
  }

  return patches
}

export function getRemoveColumnPatch(headerRow: HeaderRow, column: Column): FormPatch {
  // TODO: Find all the rows cells that have this column and remove them
  return unset(['rows', {_key: headerRow._key}, 'columns', {_key: column._key}])
}

export function getRemoveCellPatch(dataRow: DataRow, cell: Cell): FormPatch {
  return unset(['rows', {_key: dataRow._key}, 'cells', {_key: cell._key}])
}

export function getInsertCellPatch(
  dataKey: string,
  cellType: FieldDefinition,
  row: DataRow,
): FormPatch {
  return insert(
    [
      {
        _key: uuid(),
        _type: cellType?.name,
        dataKey: dataKey,
      },
    ],
    'after',
    ['rows', {_key: row._key}, 'cells', -1],
  )
}
