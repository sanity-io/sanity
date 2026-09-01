import {type CSSProperties, type ReactNode} from 'react'

export const TABLE_ROW_ACTIONS_WIDTH = 50

/**
 * Render callback for the trailing row-actions gutter, invoked per row by the
 * row-actions cell.
 */
export type TableRowActions = (props: {datum: unknown}) => ReactNode

/**
 * Selection state and callbacks for {@link DocumentTable}'s select column, provided through
 * `DocumentTableSelectionContext` so the column's header and cell components can be defined at
 * module scope with stable identities (defining them during render would remount every checkbox
 * whenever the selection changes).
 */
export interface DocumentTableSelectionContextValue {
  labels: {selectAll: string; selectRow: string}
  selectAllTestId?: string
  allSelected: boolean
  someSelected: boolean
  toggleAll: () => void
  selectedKeys: ReadonlySet<string>
  /** Keys of the currently visible rows that can be selected. */
  selectableKeys: ReadonlySet<string>
  toggleRow: (key: string) => void
  /**
   * Method syntax on purpose: rows are typed per table instance, and method parameters are
   * bivariant, so the table's `getRowKey` can be stored here without casts.
   */
  rowKey(datum: unknown): string
}

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
