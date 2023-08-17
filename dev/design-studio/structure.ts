import {StructureResolver, DefaultDocumentNodeResolver} from 'sanity'
import {CogIcon} from '@sanity/icons'
import {CustomPane} from './components/CustomPane'
import {IFrameView} from './components/IframeView'
import {JSONPreviewDocumentView} from './components/jsonPreview'
import {StyledTestView} from './schemaTypes/documentWithViews/view/styledTest'

const STRUCTURE_CUSTOM_TYPES = ['settings']

// Add `JSON` tab to the `author` document form
export const resolveDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) => {
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
      S.view.component(IFrameView).title('IFrame'),
      S.view.component(StyledTestView).title('Styled Test 1'),
      S.view.component(StyledTestView).title('Styled Test 2'),
      S.view.component(StyledTestView).title('Styled Test 3'),
      S.view.component(StyledTestView).title('Styled Test 4'),
      S.view.component(StyledTestView).title('Styled Test 5'),
      S.view.component(StyledTestView).title('Styled Test 6'),
      S.view.component(StyledTestView).title('Styled Test 7'),
      S.view.component(StyledTestView).title('Styled Test 8'),
      S.view.component(StyledTestView).title('Styled Test 9'),
    ])
  }

  return undefined
}

export const structure: StructureResolver = (S) => {
  // The `Settings` root list item
  const settingsListItem = S.listItem()
    .title('Settings')
    .icon(CogIcon)
    .child(S.editor().id('settings').schemaType('settings').documentId('settings'))

  // The default root list items (except custom ones)
  const defaultListItems = S.documentTypeListItems().filter(
    (listItem: any) => !STRUCTURE_CUSTOM_TYPES.includes(listItem.getId()),
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
        ]),
    )

  const customPaneExample = S.listItem()
    .title('Custom pane')
    .child(
      S.component(CustomPane)
        .id('custom')
        .options({custom: 'foo'})
        .title('Custom')
        .child((ctx, id) => {
          return S.list().id(String(id)).title(String(id))
        }),
    )

  const languages = [
    {name: 'no', title: 'Norwegian'},
    {name: 'en', title: 'English'},
  ]

  const creatableDocumentTypesWithoutPage = [
    {
      type: 'author',
      name: 'Authors',
    },
    {
      type: 'book',
      name: 'Books',
    },
  ]

  const contentListItem = S.listItem()
    .title('Content')
    .child(
      S.list()
        .title('Country')
        .items(
          languages.map((l) =>
            S.listItem()
              .id(l.name)
              .title(l.title)
              .child(
                S.list()
                  .title('CMS')
                  .items(
                    creatableDocumentTypesWithoutPage.map((dt) =>
                      S.listItem()
                        .id(dt.type)
                        .title(dt.name)
                        .child(
                          S.documentList()
                            .id(dt.type)
                            .title(dt.name)
                            .schemaType(dt.type)
                            .filter(`_type == "${dt.type}"`),
                        ),
                    ),
                  ),
              ),
          ),
        ),
    )

  return S.list()
    .title('Content')
    .items([
      settingsListItem,
      S.divider(),
      contentListItem,
      customPaneExample,
      listExample,
      S.divider(),
      ...defaultListItems,
    ])
}
