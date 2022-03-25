import {DocumentBuilder, StructureBuilder} from '@sanity/base/structure'
import {JSONPreviewDocumentView} from '../components/documentViews/jsonPreview'

export function resolveStructureDocumentNode(
  S: StructureBuilder,
  options: {
    documentId?: string
    schemaType: string
  }
): DocumentBuilder | null {
  const {schemaType} = options

  if (schemaType === 'author') {
    return S.document().views([
      S.view.form(),
      S.view.component(JSONPreviewDocumentView).title('JSON'),
    ])
  }

  return null
}
