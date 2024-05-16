import {type PatchEvent, type Path, type SchemaType} from 'sanity'

/**
 * @beta
 * @hidden
 */
export interface UseCopyPasteActionProps {
  documentId: string
  documentType: string
  path: Path
  schemaType: SchemaType | string
}

/**
 * @beta
 * @hidden
 */
export interface CopyActionResult {
  documentId: string
  documentType: string
  schemaTypeName: string
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
  copyResult: CopyActionResult | null
  setCopyResult: (result: CopyActionResult) => void
  sendMessage: (message: CopyActionResult) => void
  onChange: (event: PatchEvent) => void
  isValidTargetType: (targetType: string) => boolean
}
