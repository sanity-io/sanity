import S from '@sanity/desk-tool/structure-builder'
import RefreshIcon from 'part:@sanity/base/sync-icon'
import JsonDocumentDump from './components/JsonDocumentDump'

// For testing. Bump the timeout to introduce som lag
const delay = val => new Promise(resolve => setTimeout(resolve, 10, val))

export default () =>
  S.list()
    .id('root')
    .title('Content')
    .items([
      S.listItem()
        .id('docList')
        .title('Anything with a title')
        .child(() =>
          delay(
            S.documentList({
              id: 'title-list',
              title: 'Titles!',
              options: {
                filter: 'defined(title)'
              }
            })
          )
        ),

      S.listItem()
        .id('circular')
        .title('Singleton?')
        .child(delay(S.editor({id: 'editor', options: {id: 'circular', type: 'referenceTest'}}))),

      S.documentListItem()
        .id('grrm')
        .schemaType('author')
        .child(
          S.component()
            .id('dump')
            .component(JsonDocumentDump)
            .menuItems([
              S.menuItem()
                .title('Reload')
                .action('reload')
                .icon(RefreshIcon)
                .showAsAction(true)
            ])
        ),

      ...S.documentTypeListItems()
    ])
