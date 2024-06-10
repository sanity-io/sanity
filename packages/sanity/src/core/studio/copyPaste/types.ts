import {type ObjectSchemaType, type PatchEvent, type Path} from 'sanity'

/**
 * @beta
 * @hidden
 */
export interface DocumentMeta {
  documentId?: string
  documentType?: string
  schemaType: ObjectSchemaType | undefined
  onChange?: (event: PatchEvent) => void
}

/**
 * @beta
 * @hidden
 */
export interface CopyActionResult {
  _type: 'copyResult'
  documentId?: string
  documentType?: string
  isArray: boolean
  isDocument: boolean
  isObject: boolean
  items: [
    {
      documentPath: Path
      schemaTypeName: string
      schemaTypeTitle?: string
      value: unknown
    },
  ]
}

/**
 * @beta
 * @hidden
 */
export interface CopyPasteContextType {
  getDocumentMeta: () => DocumentMeta | null
  copyResult: CopyActionResult | null
  setCopyResult: (result: CopyActionResult) => void
  setDocumentMeta: (meta: Required<DocumentMeta>) => void
}
