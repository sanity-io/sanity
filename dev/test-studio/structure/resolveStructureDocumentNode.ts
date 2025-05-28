import {type DefaultDocumentNodeResolver} from 'sanity/structure'

import {JSONPreviewDocumentView} from '../components/documentViews/jsonPreview'

export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) => {
  if (schemaType === 'author') {
    return S.document().views([
      S.view.form(),
      S.view.component(JSONPreviewDocumentView).title('JSON'),
    ])
  }

  if (schemaType === 'manyViews') {
    return S.document().views([
      S.view.form(),
      S.view.component(JSONPreviewDocumentView).title('JSON 1'),
      S.view.component(JSONPreviewDocumentView).title('JSON 2'),
      S.view.component(JSONPreviewDocumentView).title('JSON 3'),
      S.view.component(JSONPreviewDocumentView).title('JSON 4'),
      S.view.component(JSONPreviewDocumentView).title('JSON 5'),
      S.view.component(JSONPreviewDocumentView).title('JSON 6'),
      S.view.component(JSONPreviewDocumentView).title('JSON 7'),
      S.view.component(JSONPreviewDocumentView).title('JSON 8'),
      S.view.component(JSONPreviewDocumentView).title('JSON 9'),
      S.view.component(JSONPreviewDocumentView).title('JSON 10'),
    ])
  }

  return null
}
