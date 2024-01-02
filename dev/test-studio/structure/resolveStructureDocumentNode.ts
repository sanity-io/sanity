import {DefaultDocumentNodeResolver} from 'sanity/structure'
import {JSONPreviewDocumentView} from '../components/documentViews/jsonPreview'

export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) => {
  if (schemaType === 'author') {
    return S.document().views([
      S.view.form(),
      S.view.component(JSONPreviewDocumentView).title('JSON'),
    ])
  }

  return null
}
