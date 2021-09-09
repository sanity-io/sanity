import S from '@sanity/desk-tool/structure-builder'
import CogIcon from 'part:@sanity/base/cog-icon'
import {CustomPane} from './components/CustomPane'
import {JSONPreviewDocumentView} from './components/jsonPreview'
import {StyledTestView} from './schema/documentWithViews/view/styledTest'

const STRUCTURE_CUSTOM_TYPES = ['settings']

// Add `JSON` tab to the `author` document form
export const getDefaultDocumentNode = ({schemaType}: {schemaType: string}) => {
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

  if (schemaType === 'documentWithViews') {
    return S.document().views([
      S.view.form(),
      S.view.component(StyledTestView).title('Styled Test'),
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
  (listItem: any) => !STRUCTURE_CUSTOM_TYPES.includes(listItem.getId())
)

const listExample = S.listItem()
  .title('List example')
  .child(
    S.list()
      .title('List example')
      .items([])
      .menuItems([
        S.menuItem()
          .title('Callback')
          .action(() => {
            // eslint-disable-next-line no-console
            console.log('Callback!')
          }),
        S.menuItem()
          .title('Sort by title')
          .action('setSortOrder')
          .params({
            by: {
              field: 'title',
              direction: 'asc',
            },
          }),
        // S.menuItem().title('No action'),
      ])
  )

const customPaneExample = S.listItem()
  .title('Custom pane')
  .child(
    S.component(CustomPane)
      .id('custom')
      .title('Custom')
      .child((id) => {
        return S.list().id(id).title(id)
      })
  )

export default () =>
  S.list()
    .title('Content')
    .items([
      settingsListItem,
      S.divider(),
      customPaneExample,
      listExample,
      S.divider(),
      ...defaultListItems,
    ])
