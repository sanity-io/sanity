import {type FormDocumentValue, type ObjectSchemaType, type PatchEvent, type Path} from 'sanity'

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
  valuePath: Path
  value: unknown
}

/**
 * @beta
 * @hidden
 */
// TODO: lift this into its own provider
export interface DocumentMeta {
  documentId: string
  documentType: string
  schemaType: ObjectSchemaType
  onChange: (event: PatchEvent) => void
}

/**
 * @beta
 * @hidden
 */
export interface CopyPasteContextType {
  setDocumentMeta: (documentMeta: DocumentMeta) => void
  onCopy: (path: Path, value: FormDocumentValue | undefined, options: CopyOptions) => Promise<void>
  onPaste: (
    targetPath: Path,
    value: FormDocumentValue | undefined,
    options: PasteOptions,
  ) => Promise<void>
}

/**
 * @beta
 * @hidden
 */
export interface BaseOptions {
  context: {
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
