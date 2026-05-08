import {StackCompactIcon, StackIcon} from '@sanity/icons'
import {type SchemaType} from '@sanity/types'
import startCase from 'lodash-es/startCase.js'
import {isDev} from 'sanity'

import {structureLocaleNamespace} from '../i18n'
import {type DocumentListBuilder} from './DocumentList'
import {DocumentTypeListBuilder, type DocumentTypeListInput} from './DocumentTypeList'
import {defaultIntentChecker} from './Intent'
import {type List} from './List'
import {type ListItem, ListItemBuilder} from './ListItem'
import {getOrderingMenuItemsForSchemaType, MenuItemBuilder} from './MenuItem'
import {DEFAULT_SELECTED_ORDERING_OPTION} from './Sort'
import {type Collection} from './StructureNodes'
import {type StructureContext} from './types'

const BUNDLED_DOC_TYPES = ['sanity.imageAsset', 'sanity.fileAsset']

function isBundledDocType(typeName: string) {
  return BUNDLED_DOC_TYPES.includes(typeName)
}

function isDocumentType(schemaType: SchemaType) {
  return schemaType.type?.name === 'document'
}

function isList(collection: Collection): collection is List {
  return collection.type === 'list'
}

function getDocumentTypes({schema}: StructureContext): string[] {
  return (
    schema
      .getTypeNames()
      .filter((n) => {
        const schemaType = schema.get(n)
        return schemaType && isDocumentType(schemaType)
      })
      .filter((n) => !isBundledDocType(n))
      // Singleton schema types are excluded from the implicit default content
      // list. Developers must surface them explicitly via the
      // `S.document().singleton()`, `S.listItem().singleton()`, or
      // `S.list().singletons()` helpers.
      .filter((n) => !schema.get(n)?.singleton)
  )
}

// Track schema types we've already warned about, so a structure that's
// resolved repeatedly (e.g. on every navigation) doesn't spam the console.
const warnedSingletonDocumentTypeListNames = new Set<string>()

export function getDocumentTypeListItems(context: StructureContext): ListItemBuilder[] {
  const types = getDocumentTypes(context)
  return types.map((typeName) => getDocumentTypeListItem(context, typeName))
}

export function getDocumentTypeListItem(
  context: StructureContext,
  typeName: string,
): ListItemBuilder {
  const {schema} = context

  const type = schema.get(typeName)
  if (!type) {
    throw new Error(`Schema type with name "${typeName}" not found`)
  }

  const title = type.title || startCase(typeName)

  return new ListItemBuilder(context)
    .id(typeName)
    .title(title)
    .schemaType(type)
    .child((id, childContext) => {
      const parent = childContext.parent as Collection
      const parentItem = isList(parent)
        ? (parent.items.find((item) => item.id === id) as ListItem)
        : null

      let list = getDocumentTypeList(context, typeName)
      if (parentItem && parentItem.title) {
        list = list.title(parentItem.title)
      }

      return list
    })
}

export function getDocumentTypeList(
  context: StructureContext,
  typeNameOrSpec: string | DocumentTypeListInput,
): DocumentListBuilder {
  const {schema, resolveDocumentNode} = context

  const schemaType = typeof typeNameOrSpec === 'string' ? typeNameOrSpec : typeNameOrSpec.schemaType
  const typeName = typeof schemaType === 'string' ? schemaType : schemaType.name
  const spec: DocumentTypeListInput =
    typeof typeNameOrSpec === 'string' ? {schemaType} : typeNameOrSpec

  const type = schema.get(typeName)
  if (!type) {
    throw new Error(`Schema type with name "${typeName}" not found`)
  }

  // Calling `S.documentTypeList()` for a singleton type still works (it'll
  // render a list containing the single document) but is almost never what
  // the developer intended. Surface a warning in dev mode so they know about
  // `S.listItem().singleton(typeName)` instead.
  if (isDev && type.singleton && !warnedSingletonDocumentTypeListNames.has(typeName)) {
    warnedSingletonDocumentTypeListNames.add(typeName)
    // eslint-disable-next-line no-console
    console.warn(
      `S.documentTypeList("${typeName}") was called for a singleton schema type. ` +
        `Singletons render only one document, so a document type list is rarely useful here. ` +
        `Consider using \`S.listItem().singleton("${typeName}")\` instead.`,
    )
  }

  const title = type.title || startCase(typeName)

  return new DocumentTypeListBuilder(context)
    .id(spec.id || typeName)
    .title(spec.title || title)
    .filter('_type == $type')
    .params({type: typeName})
    .schemaType(type)
    .defaultOrdering(DEFAULT_SELECTED_ORDERING_OPTION.by)
    .menuItemGroups(
      spec.menuItemGroups || [
        {
          id: 'sorting',
          title: 'Sort',
          i18n: {title: {key: 'menu-item-groups.actions-group', ns: structureLocaleNamespace}},
        },
        {
          id: 'layout',
          title: 'Layout',
          i18n: {title: {key: 'menu-item-groups.layout-group', ns: structureLocaleNamespace}},
        },
        {
          id: 'actions',
          title: 'Actions',
          i18n: {title: {key: 'menu-item-groups.sorting-group', ns: structureLocaleNamespace}},
        },
      ],
    )
    .child(
      spec.child ||
        ((documentId: string) => resolveDocumentNode({schemaType: typeName, documentId})),
    )
    .canHandleIntent(spec.canHandleIntent || defaultIntentChecker)
    .menuItems(
      spec.menuItems || [
        // Create new (from action button) will be added in serialization step of GenericList

        // Sort by <Y>
        ...getOrderingMenuItemsForSchemaType(context, type),

        // Display as <Z>
        new MenuItemBuilder(context)
          .group('layout')
          .i18n({title: {key: 'menu-items.layout.compact-view', ns: structureLocaleNamespace}})
          .title('Compact view') // fallback title
          .icon(StackCompactIcon)
          .action('setLayout')
          .params({layout: 'default'}),

        new MenuItemBuilder(context)
          .group('layout')
          .i18n({title: {key: 'menu-items.layout.detailed-view', ns: structureLocaleNamespace}})
          .title('Detailed view') // fallback title
          .icon(StackIcon)
          .action('setLayout')
          .params({layout: 'detail'}),

        // Create new (from menu) will be added in serialization step of GenericList
      ],
    )
}
