import {type FormDocumentValue, type ObjectSchemaType, type PatchEvent, type Path} from 'sanity'

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
  onCopy: (path: Path, value: FormDocumentValue | undefined, options?: CopyOptions) => Promise<void>
  onPaste: (
    targetPath: Path,
    value: FormDocumentValue | undefined,
    options?: PasteOptions,
  ) => Promise<void>
  onChange: ((event: PatchEvent) => void) | undefined
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
