import {type ObjectSchemaType, type PatchEvent, type Path, type SchemaType} from 'sanity'

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
export interface SanityClipboardItem {
  type: 'sanityClipboardItem'
  jsonType: SchemaType['jsonType']
  documentId?: string
  documentType?: string
  isDocument: boolean
  schemaTypeName: string
  schemaTypeTitle?: string
  valuePath: Path
  value: unknown
}

/**
 * @beta
 * @hidden
 */
export interface CopyPasteContextType {
  documentMeta: DocumentMeta | null
  setDocumentMeta: (meta: Required<DocumentMeta>) => void
}

/**
 * @beta
 * @hidden
 */
export interface BaseOptions {
  context?: {
    source: 'fieldAction' | 'documentFieldAction' | 'keyboardShortcut' | 'unknown'
  }
}

/**
 * @beta
 * @hidden
 */
export interface CopyOptions extends BaseOptions {}

/**
 * @beta
 * @hidden
 */
export interface PasteOptions extends BaseOptions {}
