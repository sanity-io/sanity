import {type ObjectSchemaType, type Path} from '@sanity/types'

import {type PatchEvent} from '../../form/patch/PatchEvent'
import {type FormDocumentValue} from '../../form/types/formDocumentValue'

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
  patchType?: 'replace' | 'append'
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
    source: 'fieldAction' | 'documentFieldAction' | 'keyboardShortcut' | 'arrayItem' | 'unknown'
  }
}

/**
 * @beta
 * @hidden
 */
export interface CopyOptions extends BaseOptions {
  patchType?: 'replace' | 'append'
}

/**
 * @beta
 * @hidden
 */
export interface PasteOptions extends BaseOptions {}
