import {type CSSProperties} from 'react'

export interface InjectedTableProps {
  as?: React.ElementType | keyof React.JSX.IntrinsicElements
  id: string
  style: {width?: number}
}

export interface Column<TableData = unknown> {
  header: (props: HeaderProps) => React.JSX.Element
  cell: (props: {
    datum: TableData
    cellProps: InjectedTableProps
    sorting: boolean
  }) => React.ReactNode
  id: keyof TableData | string
  width: number | null
  style?: CSSProperties
  sorting?: boolean
  sortTransform?: (value: TableData) => number | string
}

export interface TableHeaderProps {
  headers: Omit<Column, 'cell'>[]
  searchDisabled?: boolean
}

export type HeaderProps = Omit<TableHeaderProps, 'headers'> & {
  headerProps: InjectedTableProps
  header: Pick<Column, 'sorting' | 'id'>
}
