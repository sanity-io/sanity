import {type RowData} from '@tanstack/react-table'

import {type BaseStructureToolPaneProps} from '../src/structure/panes/types'

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    patchDocument?: (documentId: string, fieldId: string, value: any) => void
    selectedAnchor: number | null
    setSelectedAnchor: (anchorRowIndex: number | null) => void
    paneProps: BaseStructureToolPaneProps<'documentList'>
  }
  interface ColumnMeta<TData extends RowData, TValue> {
    /**
     * Allows for custom headers to be rendered in the table
     * opting out from the default header rendering.
     */
    customHeader?: boolean
    borderWidth?: number
  }
}
