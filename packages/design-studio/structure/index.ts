import S from '@sanity/desk-tool/structure-builder'
import {JSONPreviewDocumentView} from '../documentViews/jsonPreview'

export const getDefaultDocumentNode = ({schemaType}) => {
  // Conditionally return a different configuration based on the schema type
  if (schemaType === 'author') {
    return S.document().views([
      S.view.form(),
      S.view.component(JSONPreviewDocumentView).title('JSON')
    ])
  }

  return undefined
}

export default S.defaults()
