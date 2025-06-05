import {type DataRow, type HeaderRow, type Table} from './types'

export function getTableHeaderRow(table: Table | undefined): HeaderRow | undefined {
  if (!table) return undefined
  return table.rows.find((row) => row._type === 'headerRow')
}

export function getTableDataRows(table: Table | undefined): DataRow[] {
  if (!table) return []
  return table.rows.filter((row) => row._type === 'dataRow')
}

export function getTableValues(table: Table) {
  /**
   * The table header is what we consider the entry point for the columns, with that
   * in mind, we can get each column from the header row.
   *
   * So we get all the rows, and for each row we create the columns from the header row, following the columns order.
   * If a value doesn't exist for that column in the row, it will return null.
   * If it does exist, it will return the Cell.
   *  */
  const header = getTableHeaderRow(table)?.columns

  const rows = getTableDataRows(table).map((row) => {
    if (!header) return []
    // For each column in the header row, we need to get the value from the row.
    return header.map((column) => {
      const rowCell = row.cells.find((cell) => cell.dataKey === column.dataKey)
      return rowCell ?? null
    })
  })
  return {
    header,
    rows,
  }
}
