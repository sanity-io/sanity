import {type RowData} from '@tanstack/react-table'

import {type DocumentSheetListSchemaTypes} from '../src/structure/panes/documentList/sheetList/types'
import {
  type BaseStructureToolPaneProps,
  type DocumentSheetListValueTypes,
} from '../src/structure/panes/types'

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    patchDocument?: (documentId: string, fieldId: string, value: any) => voi
    unsetDocumentValue?: (documentId: string, fieldId: string) => void
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
    fieldType?: DocumentSheetListSchemaTypes
    disableCellFocus?: boolean
  }
  interface CellContext<TData extends RowData, TValue> {
    'cellValue': DocumentSheetListValueTypes
    /**
     * Changes the cell value but not the underlying data, the data will be changed when the user blurs the cell.
     * For immediate change use `handlePatchField` from cell context
     */
    'setCellValue': (value: DocumentSheetListValueTypes) => void
    /**
     * `fieldRef` should be assigned as `ref` to the input element in the cell
     * to allow for focus controls
     */
    'fieldRef': MutableRefObject<HTMLElement>
    /**
     *
     * Suppress the default mouse down DOM behavior and use the sheet list behavior instead
     */
    'shouldPreventDefaultMouseDownBehavior': () => void
    /**
     *
     * * Suppress the default event behavior on the cell input and use the sheet list behavior instead
     */
    'shouldPreventDefaultInputBehavior': () => void
    'data-testid': string
    /**
     * Immediate change of the cell value, doing a server patch action.
     */
    'handlePatchField': (value: any) => void
    /**
     * Immediate unset of the cell value, doing a server patch unset action.
     */
    'handleUnsetField': () => void
  }
}
