import {DocumentNodeResolver} from '@sanity/base'
import {JSONPreviewDocumentView} from '../components/documentViews/jsonPreview'

export const resolveStructureDocumentNode: DocumentNodeResolver = (S, {schemaType}) => {
  if (schemaType === 'author') {
    return S.document().views([
      S.view.form(),
      S.view.component(JSONPreviewDocumentView).title('JSON'),
    ])
  }

  return null
}
