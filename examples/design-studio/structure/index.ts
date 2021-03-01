import S from '@sanity/desk-tool/structure-builder'
import CogIcon from 'part:@sanity/base/cog-icon'
import {JSONPreviewDocumentView} from '../documentViews/jsonPreview'

const STRUCTURE_CUSTOM_TYPES = ['settings']
const STRUCTURE_LIST_ITEM_DIVIDER = S.divider()

// Add `JSON` tab to the `author` document form
export const getDefaultDocumentNode = ({schemaType}) => {
  // Conditionally return a different configuration based on the schema type
  if (schemaType === 'author') {
    return S.document().views([
      S.view.form(),
      S.view.component(JSONPreviewDocumentView).title('JSON'),
    ])
  }

  if (schemaType === 'allInputs') {
    return S.document().views([
      S.view.form(),
      S.view.component(JSONPreviewDocumentView).title('JSON'),
    ])
  }

  return undefined
}

// The `Settings` root list item
const settingsListItem = S.listItem()
  .title('Settings')
  .icon(CogIcon)
  .child(S.editor().id('settings').schemaType('settings').documentId('settings'))

// The default root list items (except custom ones)
const defaultListItems = S.documentTypeListItems().filter(
  (listItem) => !STRUCTURE_CUSTOM_TYPES.includes(listItem.getId())
)

export default () =>
  S.list()
    .title('Content')
    .items([settingsListItem, STRUCTURE_LIST_ITEM_DIVIDER, ...defaultListItems])
