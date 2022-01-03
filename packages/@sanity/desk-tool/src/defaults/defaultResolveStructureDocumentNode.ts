import {DocumentBuilder, StructureBuilder} from '@sanity/base/structure'

export function defaultResolveDocumentNode(
  _S: StructureBuilder,
  _options: {
    documentId?: string
    schemaType: string
  }
): DocumentBuilder | null {
  return null
}
