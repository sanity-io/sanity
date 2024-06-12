import {type BooleanSchemaType, type NumberSchemaType, type StringSchemaType} from '@sanity/types'
import {type RowData} from '@tanstack/react-table'

import {type BaseStructureToolPaneProps} from '../src/structure/panes/types'

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
    fieldType?: StringSchemaType | NumberSchemaType | BooleanSchemaType
    disableCellFocus?: boolean
  }
  interface CellContext<TData extends RowData, TValue> {
    'cellValue': number | string
    'setCellValue': (value: number | string) => void
    'fieldRef': MutableRefObject<HTMLElement>
    'getOnMouseDownHandler': (
      suppressDefaultBehavior: boolean,
    ) => (event: React.MouseEvent<HTMLElement>) => void
    'data-testid': string
  }
}
