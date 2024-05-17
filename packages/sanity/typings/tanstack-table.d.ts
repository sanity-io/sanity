import {type RowData} from '@tanstack/react-table'

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    updateData: () => void
    hasAnchorSelected: number | null
    setHasAnchorSelected: (anchorRowIndex: number | null) => void
  }
}
