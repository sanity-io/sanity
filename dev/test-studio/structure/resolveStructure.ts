import {
  BinaryDocumentIcon,
  CodeIcon,
  CogIcon,
  EarthGlobeIcon,
  ImagesIcon,
  PlugIcon,
  RocketIcon,
  SyncIcon,
  TerminalIcon,
  ThListIcon,
  UsersIcon,
} from '@sanity/icons'
import {uuid} from '@sanity/uuid'
import {type Observable, timer} from 'rxjs'
import {map} from 'rxjs/operators'
import {type DocumentStore, type SanityDocument, type Schema} from 'sanity'
import {
  type ItemChild,
  type StructureBuilder,
  structureLocaleNamespace,
  type StructureResolver,
} from 'sanity/structure'

import {DebugPane} from '../components/panes/debug'
import {JsonDocumentDump} from '../components/panes/JsonDocumentDump'
import {PerspectiveExample} from '../components/PerspectiveExample'
import {TranslateExample} from '../components/TranslateExample'
import {_buildTypeGroup} from './_buildTypeGroup'
import {delayValue} from './_helpers'
import {
  CI_INPUT_TYPES,
  DEBUG_FIELD_GROUP_TYPES,
  DEBUG_INPUT_TYPES,
  EXTERNAL_PLUGIN_INPUT_TYPES,
  PLUGIN_INPUT_TYPES,
  STANDARD_INPUT_TYPES,
  STANDARD_PORTABLE_TEXT_INPUT_TYPES,
  TS_DOC_TYPES,
} from './constants'
import {typesInOptionGroup} from './groupByOption'

export const structure: StructureResolver = (
  S,
  {schema, documentStore, i18n, perspectiveStack},
) => {
  const {t} = i18n
  return S.list()
    .title(t('testStudio:structure.root.title' as const) || 'Content')
    .items([
      S.documentListItem().id('validation').schemaType('allTypes'),
      S.listItem()
        .title('Sections by perspective')
        .id('sections-by-perspective')
        .child(() => {
          const doc$ = documentStore.listenQuery(
            `*[_id == "validation"][0]`,
            {},
            {
              perspective: perspectiveStack,
            },
          )

          return S.component(PerspectiveExample).id('sections-by-perspective').options({doc$})
        }),
      S.listItem()
        .id('translate')
        .title('Translate Test')
        .child(S.component(TranslateExample).id('example')),
      S.listItem()
        .title('Untitled repro')
        .child(
          S.list()
            .title('Untitled repro')
            .menuItems([
              S.menuItem()
                .title('Edit GRRM')
                .icon(CogIcon)
                .showAsAction(true)
                .intent({
                  type: 'edit',
                  params: {
                    id: 'grrm',
                    type: 'author',
                  },
                }),
            ])
            .items([
              S.documentListItem().id('grrm').schemaType('author'),
              S.listItem()
                .id('documentStore')
                .title('Document store')
                .child(documentStoreDrivenChild(S, schema, documentStore)),
              S.listItem()
                .id('randomObservable')
                .title('Random observable')
                .child(itemTitleChangesEverySecond(S)),
            ]),
        ),

      _buildTypeGroup(S, schema, {
        icon: TerminalIcon,
        id: 'input-debug',
        title: 'Debug inputs',
        types: DEBUG_INPUT_TYPES,
        groups: [
          {
            id: 'field-groups',
            title: 'Field groups',
            types: DEBUG_FIELD_GROUP_TYPES,
          },
        ],
      }),

      S.divider()
        .title('Divider title')
        .i18n({title: {key: 'text-divider-title', ns: structureLocaleNamespace}}),

      _buildTypeGroup(S, schema, {
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
      _buildTypeGroup(S, schema, {
        icon: PlugIcon,
        id: 'input-plugin',
        title: 'Plugin inputs',
        types: PLUGIN_INPUT_TYPES,
      }),
      _buildTypeGroup(S, schema, {
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
                      S.menuItem()
                        .title('From Menu Item Create Intent')
                        .intent({
                          type: 'create',
                          params: {type: 'author', id: `special.${uuid()}`},
                        }),
                      S.menuItem()
                        .title('Also Menu Item Create Intent')
                        .intent({
                          type: 'create',
                          params: {type: 'author', id: uuid()},
                        }),
                      S.menuItem()
                        .title('Test 1')
                        // eslint-disable-next-line no-alert
                        .action(() => alert('you clicked!'))
                        .showAsAction(true),
                      S.menuItem()
                        .title('Test Edit Intent (as action)')
                        .intent({
                          type: 'edit',
                          params: {id: 'grrm', type: 'author'},
                        })
                        .icon(RocketIcon)
                        .showAsAction(),
                      S.menuItem().title('Should warn in console').action('shouldWarn'),
                      S.menuItem()
                        .title('Test Edit Intent (in menu)')
                        .intent({
                          type: 'edit',
                          params: {id: 'foo-bar', type: 'author'},
                        }),
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
                        .child(S.document().documentId('component1-1-child').schemaType('author')),
                    ),
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
                    .child(S.document().documentId('component2-child').schemaType('author')),
                ),

              S.divider(),

              S.listItem()
                .title('Anything with a title')
                // .icon(() => <span data-sanity-icon>T</span>)
                .child(() =>
                  delayValue(
                    S.documentList({
                      id: 'title-list',
                      title: 'Titles!',
                      options: {
                        filter: 'defined(title)',
                      },
                    }),
                  ),
                ),

              S.listItem()
                .title('Drafts')
                .child(
                  S.documentList({
                    id: 'drafts-list',
                    title: 'Drafts',
                    options: {
                      filter: '_id in path("drafts.**")',
                    },
                  }).apiVersion('2023-07-28'),
                ),

              S.listItem()
                .title('Authors & Books')
                .child(
                  S.documentList({
                    id: 'authors-and-books',
                    title: 'Authors & Books',
                    options: {
                      filter: '_type == "author" || _type == "book"',
                    },
                  }).apiVersion('2023-07-28'),
                ),

              // A singleton not using `documentListItem`, eg no built-in preview
              S.listItem()
                .title('Singleton?')
                .child(
                  delayValue(
                    S.editor({
                      id: 'editor',
                      options: {id: 'circular', type: 'referenceTest'},
                    }).title('Specific title!'),
                  ) as any,
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
                        .icon(SyncIcon)
                        .showAsAction(true),
                    ]),
                ),

              // A "singleton" which should use a default preview
              S.documentListItem().id('jrr-tolkien').schemaType('author'),
              S.listItem()
                .id('field-groups-test-1')
                .title('Field groups test 1')
                .child(S.document().documentId('field-groups-test-1').schemaType('fieldGroups')),
              S.listItem()
                .id('field-groups-test-2')
                .title('Field groups test 2')
                .child(
                  S.document().documentId('field-groups-test-2').schemaType('fieldGroupsMany'),
                ),
              S.listItem()
                .title('Deep')
                .child(
                  S.list()
                    .title('Deeper')
                    .items([
                      S.documentTypeListItem('book').title('Books'),
                      S.documentTypeListItem('author').title('Authors'),
                    ]),
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
                                                    ]),
                                                ),
                                            ]),
                                        ),
                                    ]),
                                ),
                            ]),
                        ),
                    ]),
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
                      ]),
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
                    .params({type: 'book'}),
                ),

              S.divider(),

              S.documentTypeListItem('sanity.imageAsset').title('Images').icon(ImagesIcon),

              S.divider(),

              S.listItem().title('All document types').child(S.defaults()),
            ]),
        ),

      S.divider(),

      _buildTypeGroup(S, schema, {
        icon: SyncIcon,
        id: 'input-ci',
        title: 'CI',
        types: CI_INPUT_TYPES,
      }),

      S.divider(),

      _buildTypeGroup(S, schema, {
        id: 'v3',
        title: 'V3 APIs',
        types: typesInOptionGroup(S, schema, 'v3'),
      }),

      S.divider(),

      _buildTypeGroup(S, schema, {
        icon: CodeIcon,
        id: 'tsdoc',
        title: 'TS doc',
        types: TS_DOC_TYPES,
      }),

      S.divider(),

      S.listItem()
        .title('Default ordering test')
        .id('default-ordering')
        .child(() =>
          S.documentTypeList('species')
            .defaultOrdering([{field: 'species', direction: 'asc'}])
            .title('Species')
            .id('default-ordering-list')
            .filter('_type == $type'),
        ),

      ...S.documentTypeListItems()
        .filter((listItem) => {
          const id = listItem.getId()

          return (
            id &&
            !CI_INPUT_TYPES.includes(id) &&
            !DEBUG_INPUT_TYPES.includes(id) &&
            !STANDARD_INPUT_TYPES.includes(id) &&
            !STANDARD_PORTABLE_TEXT_INPUT_TYPES.includes(id) &&
            !PLUGIN_INPUT_TYPES.includes(id) &&
            !EXTERNAL_PLUGIN_INPUT_TYPES.includes(id) &&
            !DEBUG_FIELD_GROUP_TYPES.includes(id) &&
            !typesInOptionGroup(S, schema, 'v3').includes(id) &&
            !TS_DOC_TYPES.includes(id)
          )
        })
        .map((listItem) => {
          // Create Sheet List menu option
          const listItemId = listItem.getId()
          if (!listItemId) return listItem

          return listItem.child(
            S.documentTypeList(listItemId).menuItems([
              S.menuItem()
                .title('Table view')
                .group('layout')
                .action('setLayout')
                .params({layout: 'sheetList'})
                .icon(ThListIcon),
              ...(S.documentTypeList(listItemId).getMenuItems() || []),
            ]),
          )
        }),
      S.divider(),
      S.documentTypeListItem('sanity.imageAsset').icon(ImagesIcon),
      S.documentTypeListItem('sanity.fileAsset').icon(BinaryDocumentIcon),
    ])
}

function documentStoreDrivenChild(
  S: StructureBuilder,
  schema: Schema,
  documentStore: DocumentStore,
): Observable<ItemChild> {
  return documentStore
    .listenQuery(
      '*[!(_type match "**.**")] | order(_updatedAt desc)[0...10]',
      {},
      {throttleTime: 1000},
    )
    .pipe(
      map((docs: SanityDocument[]) => {
        // Only include document types that exist in the current schema
        const filteredDocs = docs.filter((doc) => schema.has(doc._type))
        return S.list()
          .title('Some recently edited documents')
          .items(filteredDocs.map((doc) => S.documentListItem().schemaType(doc._type).id(doc._id)))
      }),
    )
}

function itemTitleChangesEverySecond(S: StructureBuilder) {
  return timer(0, 1000).pipe(map(() => S.list().title(`Random title ${Math.random()}`)))
}
