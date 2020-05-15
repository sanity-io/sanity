import React from 'react'
import RefreshIcon from 'part:@sanity/base/sync-icon'
import EyeIcon from 'part:@sanity/base/eye-icon'
import EditIcon from 'part:@sanity/base/edit-icon'
import MdImage from 'react-icons/lib/md/image'
import JsonDocumentDump from './components/JsonDocumentDump'
import {DeveloperPreview} from './previews/developer'
import S from '@sanity/desk-tool/structure-builder'

// For testing. Bump the timeout to introduce som lag
const delay = (val, ms = 10) => new Promise(resolve => setTimeout(resolve, ms, val))

export const getDefaultDocumentNode = ({schemaType}) => {
  return S.document().views(
    [
      S.view.form().icon(EditIcon),
      schemaType === 'author' &&
        S.view
          .component(DeveloperPreview)
          .options({some: 'option'})
          .icon(EyeIcon)
          .title('Preview')
    ].filter(Boolean)
  )
}

export default () =>
  S.list()
    .id('root')
    .title('Content')
    .items([
      S.documentListItem()
        .id('foo-bar')
        .title('Singleton author')
        .schemaType('author'),

      S.divider(),

      S.listItem()
        .title('Anything with a title')
        .icon(() => <span style={{fontSize: '2em'}}>T</span>)
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
        .title('Singleton?')
        .child(
          delay(
            S.editor({id: 'editor', options: {id: 'circular', type: 'referenceTest'}}).title(
              'Specific title!'
            )
          )
        )
        .showIcon(false),

      S.documentListItem()
        .id('grrm')
        .schemaType('author')
        .child(
          S.component(JsonDocumentDump)
            .id('json-dump')
            .options({pass: 'through'})
            .menuItems([
              S.menuItem()
                .title('Reload')
                .action('reload')
                .icon(RefreshIcon)
                .showAsAction(true)
            ])
        ),
      S.listItem()
        .title('Deep')
        .child(
          S.list()
            .title('Deeper')
            .items([
              S.documentTypeListItem('book').title('Books'),
              S.documentTypeListItem('author').title('Authors')
            ])
        ),
      S.listItem()
        .title('Deep panes')
        .child(
          S.list()
            .title('Depth 1')
            .items([
              S.listItem()
                .title('Deeper')
                .child(
                  S.list()
                    .title('Depth 2')
                    .items([
                      S.listItem()
                        .title('Even deeper')
                        .child(
                          S.list()
                            .title('Depth 3')
                            .items([
                              S.listItem()
                                .title('Keep digging')
                                .child(
                                  S.list()
                                    .title('Depth 4')
                                    .items([
                                      S.listItem()
                                        .title('Dig into the core of the earth')
                                        .child(
                                          S.list()
                                            .title('Depth 5')
                                            .items([
                                              S.documentListItem()
                                                .id('grrm')
                                                .schemaType('author')
                                            ])
                                        )
                                    ])
                                )
                            ])
                        )
                    ])
                )
            ])
        ),

      S.listItem({
        id: 'developers',
        title: 'Developers',
        schemaType: 'author',
        child: () =>
          S.documentTypeList('author')
            .title('Developers')
            .filter('_type == $type && role == $role')
            .params({type: 'author', role: 'developer'})
            .initialValueTemplates(S.initialValueTemplateItem('author-developer'))
      }),

      S.listItem({
        id: 'books-by-author',
        title: 'Books by author',
        schemaType: 'book',
        child: () =>
          S.documentTypeList('author').child(authorId =>
            S.documentTypeList('book')
              .title('Books by author')
              .filter('_type == $type && author._ref == $authorId')
              .params({type: 'book', authorId})
              .initialValueTemplates([S.initialValueTemplateItem('book-by-author', {authorId})])
          )
      }),

      S.divider(),

      ...S.documentTypeListItems(),

      S.listItem()
        .title('Custom books list')
        .child(
          S.documentList()
            .title('Unspecified books list')
            .menuItems(S.documentTypeList('book').getMenuItems())
            .filter('_type == $type')
            .params({type: 'book'})
        ),

      S.documentTypeListItem('sanity.imageAsset')
        .title('Images')
        .icon(MdImage)
    ])
