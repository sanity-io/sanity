import {type ObjectSchemaType, type PatchEvent} from 'sanity'

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
  schemaTypeName: string
  schemaTypeTitle?: string
  path: any[]
  docValue: any // Adjust the type based on your actual data structure
  isDocument: boolean
  isArray: boolean
  isObject: boolean
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
  refreshCopyResult: (isCopyResultOverride?: boolean) => Promise<void>
  isValidTargetType: (targetType: string) => boolean
  isCopyResultInClipboard: boolean | null
}
