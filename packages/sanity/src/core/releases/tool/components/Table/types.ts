import {type CSSProperties} from 'react'

export interface InjectedTableProps {
  as?: React.ElementType | keyof React.JSX.IntrinsicElements
  id: string
  style: {width?: number}
}

export type SortDirection = 'asc' | 'desc'

interface BaseColumn<TableData = unknown> {
  id: keyof TableData | string
  width: number | null
  style?: CSSProperties
  sorting?: boolean
  sortTransform?: (value: TableData, sortDirection: SortDirection) => number | string
}

export interface HiddenColumn<TableData = unknown> extends BaseColumn<TableData> {
  hidden: true
  cell?: undefined
  header?: undefined
}

export interface VisibleColumn<TableData = unknown> extends BaseColumn<TableData> {
  hidden?: false
  cell: (props: {
    datum: TableData & {isLoading?: boolean}
    cellProps: InjectedTableProps
    sorting: boolean
  }) => React.ReactNode
  header: (props: HeaderProps) => React.JSX.Element
}

export type Column<TableData = unknown> = HiddenColumn<TableData> | VisibleColumn<TableData>

export interface TableHeaderProps {
  headers: Omit<Column, 'cell'>[]
  searchDisabled?: boolean
}

export type HeaderProps = Omit<TableHeaderProps, 'headers'> & {
  headerProps: InjectedTableProps
  header: Pick<Column, 'sorting' | 'id'>
}
