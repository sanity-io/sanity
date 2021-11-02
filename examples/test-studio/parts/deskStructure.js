import S from '@sanity/desk-tool/structure-builder'
import {EarthGlobeIcon, PlugIcon, TagIcon, TerminalIcon} from '@sanity/icons'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import React from 'react'
import schema from 'part:@sanity/base/schema'

// Icons
import RefreshIcon from 'part:@sanity/base/sync-icon'
import EyeIcon from 'part:@sanity/base/eye-icon'
import EditIcon from 'part:@sanity/base/edit-icon'
import ImagesIcon from 'part:@sanity/base/images-icon'
import UsersIcon from 'part:@sanity/base/users-icon'

// Custom panes
import {DebugPane} from './panes/debug'
import JsonDocumentDump from './panes/JsonDocumentDump'

// Custom document views
import {DeveloperPreview} from './documentViews/developer'

const STANDARD_INPUT_TYPES = [
  'arraysTest',
  'booleansTest',
  'dateTest',
  'datetimeTest',
  'emailsTest',
  'filesTest',
  'imagesTest',
  'numbersTest',
  'objectsTest',
  'referenceTest',
  'slugsTest',
  'stringsTest',
  'textsTest',
  'urlsTest',
]

const STANDARD_PORTABLE_TEXT_INPUT_TYPES = [
  'blocksTest',
  // 'richTextObject',
  'simpleBlock',
]

const PLUGIN_INPUT_TYPES = [
  'codeTest',
  'colorTest',
  'geopointTest',
  'orderableCategory',
  'orderableTag',
]

const DEBUG_INPUT_TYPES = [
  'actionsTest',
  'conditionalFieldsTest',
  'customInputsTest',
  'documentActionsTest',
  'empty',
  'fieldsetsTest',
  'fieldValidationInferReproDoc',
  'focusTest',
  'documentWithHoistedPt',
  'initialValuesTest',
  'invalidPreviews',
  'thesis',
  'noTitleField',
  'poppers',
  'presence',
  'previewImageUrlTest',
  'previewMediaTest',
  'previewSelectBugRepro',
  'radio',
  'readOnlyTest',
  'recursiveDocument',
  'recursiveArraysTest',
  'recursiveObjectTest',
  'recursivePopoverTest',
  'reservedKeywordsTest',
  'select',
  'typeWithNoToplevelStrings',
  'uploadsTest',
  'validationTest',
  'withDocumentTest',
]

const EXTERNAL_PLUGIN_INPUT_TYPES = ['markdownTest', 'muxVideoPost']

// For testing. Bump the timeout to introduce som lag
const delay = (val, ms = 10) => new Promise((resolve) => setTimeout(resolve, ms, val))

export const getDefaultDocumentNode = ({schemaType}) => {
  return S.document().views(
    [
      S.view.form().icon(EditIcon),
      schemaType === 'author' &&
        S.view.component(DeveloperPreview).options({some: 'option'}).icon(EyeIcon).title('Preview'),
    ].filter(Boolean)
  )
}

// opts: {icon?: React.ComponentType, id: string, title: string, types: string[]}
function _buildTypeGroup(opts) {
  const supportedIntents = ['create', 'edit']

  return S.listItem()
    .title(opts.title)
    .icon(opts.icon)
    .id(opts.id)
    .child(
      S.list()
        .title(opts.title)
        .id(opts.id)
        .items(
          (opts.groups || []).map(_buildTypeGroup).concat(
            opts.types.map((typeName) => {
              const schemaType = schema.get(typeName)

              return S.listItem()
                .icon(schemaType?.icon)
                .title(schemaType?.title || typeName)
                .id(typeName)
                .child(
                  S.documentList()
                    .canHandleIntent((intentName, params) => {
                      return supportedIntents.includes(intentName) && typeName === params.type
                    })
                    .id(typeName)
                    .title(schemaType.title || typeName)
                    .schemaType(typeName)
                    .filter(`_type == $type`)
                    .params({type: typeName})
                )
            })
          )
        )
    )
}

export default () =>
  S.list()
    .id('root')
    .title('Content')
    .items([
      S.listItem()
        .title('Untitled repro')
        .child(
          S.list()
            .title('Untitled repro')
            .items([S.documentListItem().id('grrm').schemaType('author')])
        ),

      _buildTypeGroup({
        icon: TerminalIcon,
        id: 'input-debug',
        title: 'Debug inputs',
        types: DEBUG_INPUT_TYPES,
      }),

      S.divider(),

      _buildTypeGroup({
        id: 'input-standard',
        title: 'Standard inputs',
        types: STANDARD_INPUT_TYPES,
        groups: [
          {
            id: 'portable-text',
            title: 'Portable Text',
            types: STANDARD_PORTABLE_TEXT_INPUT_TYPES,
          },
        ],
      }),
      _buildTypeGroup({
        icon: PlugIcon,
        id: 'input-plugin',
        title: 'Plugin inputs',
        types: PLUGIN_INPUT_TYPES,
      }),
      _buildTypeGroup({
        icon: EarthGlobeIcon,
        id: 'input-external-plugin',
        title: 'External plugin inputs',
        types: EXTERNAL_PLUGIN_INPUT_TYPES,
      }),

      S.divider(),

      S.listItem()
        .id('custom')
        .title('Custom panes')
        .child(
          S.list()
            .id('custom')
            .title('Custom panes')
            .items([
              S.listItem()
                .id('component1')
                .title('Component pane (1)')
                .child(
                  S.component(DebugPane)
                    .id('component1')
                    .title('Component pane #1')
                    .options({no: 1})
                    .menuItems([
                      S.menuItem().title('Test 1').action('test-1').showAsAction(true),
                      S.menuItem().title('Test 2').action('test-2'), //.showAsAction(true),
                    ])
                    .child(
                      S.component(DebugPane)
                        .id('component1-1')
                        .title('Component pane #1.1')
                        .options({no: 1})
                        .menuItems([
                          S.menuItem().title('Test 1').action('test-1').showAsAction(true),
                          S.menuItem().title('Test 2').action('test-2'), //.showAsAction(true),
                        ])
                        .child(S.document().documentId('component1-1-child').schemaType('author'))
                    )
                ),
              S.listItem()
                .id('component2')
                .title('Component pane (2)')
                .child(
                  S.component(DebugPane)
                    .id('component2')
                    .title('Component pane #2')
                    .options({no: 2})
                    .menuItems([S.menuItem().title('Test 1').action('test-1').showAsAction(true)])
                    .child(S.document().documentId('component2-child').schemaType('author'))
                ),

              S.divider(),

              // A "singleton" using a document node with no schema type
              // This is deprecated and scheduled for removal
              S.documentListItem()
                .id('foo-bar')
                .title('Singleton author')
                .schemaType('author')
                .child(S.document().documentId('foo-bar')),

              S.divider(),

              S.listItem()
                .title('Anything with a title')
                .icon(() => <span data-sanity-icon>T</span>)
                .child(() =>
                  delay(
                    S.documentList({
                      id: 'title-list',
                      title: 'Titles!',
                      options: {
                        filter: 'defined(title)',
                      },
                    })
                  )
                ),

              // A singleton not using `documentListItem`, eg no built-in preview
              S.listItem()
                .title('Singleton?')
                .child(
                  delay(
                    S.editor({
                      id: 'editor',
                      options: {id: 'circular', type: 'referenceTest'},
                    }).title('Specific title!')
                  )
                )
                .showIcon(false),

              // A "singleton" which overrides the title, and provides a custom child
              S.documentListItem()
                .id('grrm')
                .title('GRRM')
                .schemaType('author')
                .child(
                  S.component(JsonDocumentDump)
                    .id('json-dump')
                    .title('GRRM')
                    .options({pass: 'through'})
                    .menuItems([
                      S.menuItem()
                        .title('Reload')
                        .action('reload')
                        .icon(RefreshIcon)
                        .showAsAction(true),
                    ])
                ),

              // A "singleton" which should use a default preview
              S.documentListItem().id('jrr-tolkien').schemaType('author'),

              S.listItem()
                .title('Deep')
                .child(
                  S.list()
                    .title('Deeper')
                    .items([
                      S.documentTypeListItem('book').title('Books'),
                      S.documentTypeListItem('author').title('Authors'),
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
                                                        .schemaType('author'),
                                                    ])
                                                ),
                                            ])
                                        ),
                                    ])
                                ),
                            ])
                        ),
                    ])
                ),

              S.listItem({
                id: 'developers',
                icon: UsersIcon,
                title: 'Developers',
                schemaType: 'author',
                child: () =>
                  S.documentTypeList('author')
                    .title('Developers')
                    .filter('_type == $type && role == $role')
                    .params({type: 'author', role: 'developer'})
                    .initialValueTemplates(S.initialValueTemplateItem('author-developer')),
              }),

              S.listItem({
                id: 'books-by-author',
                title: 'Books by author',
                schemaType: 'book',
                child: () =>
                  S.documentTypeList('author').child((authorId) =>
                    S.documentTypeList('book')
                      .title('Books by author')
                      .filter('_type == $type && author._ref == $authorId')
                      .params({type: 'book', authorId})
                      .initialValueTemplates([
                        S.initialValueTemplateItem('book-by-author', {authorId}),
                      ])
                  ),
              }),

              S.divider(),

              S.listItem()
                .title('Custom books list')
                .child(
                  S.documentList()
                    .title('Unspecified books list')
                    .menuItems(S.documentTypeList('book').getMenuItems())
                    .filter('_type == $type')
                    .params({type: 'book'})
                ),

              S.divider(),

              S.documentTypeListItem('sanity.imageAsset').title('Images').icon(ImagesIcon),
            ])
        ),

      S.listItem()
        .icon(PlugIcon)
        .id('plugin')
        .title('Plugin panes')
        .child(
          S.list()
            .id('plugin')
            .title('Plugin panes')
            .items([
              orderableDocumentListDeskItem({
                type: 'orderableCategory',
                icon: TagIcon,
                title: 'Category (orderable)',
              }),
              orderableDocumentListDeskItem({
                type: 'orderableTag',
                icon: TagIcon,
                title: 'Tag (orderable)',
              }),
            ])
        ),

      S.divider(),

      ...S.documentTypeListItems().filter(
        (listItem) =>
          !DEBUG_INPUT_TYPES.includes(listItem.getId()) &&
          !STANDARD_INPUT_TYPES.includes(listItem.getId()) &&
          !STANDARD_PORTABLE_TEXT_INPUT_TYPES.includes(listItem.getId()) &&
          !PLUGIN_INPUT_TYPES.includes(listItem.getId()) &&
          !EXTERNAL_PLUGIN_INPUT_TYPES.includes(listItem.getId())
      ),
    ])
