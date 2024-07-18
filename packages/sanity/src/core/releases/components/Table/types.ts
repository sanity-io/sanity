export interface InjectedTableProps {
  as?: React.ElementType | keyof JSX.IntrinsicElements
  id: string
  style: {width?: number}
}

export interface Column<TableData = unknown> {
  header: (props: HeaderProps) => JSX.Element
  cell: (props: {
    datum: TableData
    cellProps: InjectedTableProps
    sorting: boolean
  }) => React.ReactNode
  id: keyof TableData | string
  width: number | null
  sorting?: boolean
}

export interface TableHeaderProps {
  headers: Omit<Column, 'cell'>[]
  searchDisabled?: boolean
}

export type HeaderProps = Omit<TableHeaderProps, 'headers'> & {
  headerProps: InjectedTableProps
  header: Pick<Column, 'sorting' | 'id'>
}
