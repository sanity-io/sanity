export interface HeaderRow {
  _key: string
  _type: 'headerRow'
  columns: Column[]
}

export interface DataRow {
  _key: string
  _type: 'dataRow'
  cells: Cell[]
}

export interface Table {
  rows: (HeaderRow | DataRow)[]
}

export interface Cell<FieldValue = any> {
  _key: string
  _type: string
  dataKey: string
  value: FieldValue
}

export interface Column {
  _key: string
  _type: 'header'
  dataKey: string
  dataType: string
  title: string
}
