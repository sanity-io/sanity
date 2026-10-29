import {type DefaultDocumentNodeResolver} from 'sanity/structure'

import {JSONPreviewDocumentView} from '../components/documentViews/jsonPreview'
import {VariantVersionsView} from '../components/documentViews/VariantVersionsView'

export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) => {
  if (schemaType === 'book') {
    return S.document().views([
      S.view.form(),
      S.view.component(VariantVersionsView).id('variant-versions').title('Variants'),
    ])
  }

  if (schemaType === 'author') {
    return S.document().views([
      S.view.form(),
      S.view.component(JSONPreviewDocumentView).title('JSON'),
    ])
  }

  if (schemaType === 'manyViews') {
    return S.document()
      .views([
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
      .defaultPanes(['editor', 'json-10'])
  }

  return null
}
