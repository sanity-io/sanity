import {SchemaType} from '@sanity/types'
import {startCase} from 'lodash'
import {StackCompactIcon, StackIcon} from '@sanity/icons'
import {MenuItemBuilder, getOrderingMenuItemsForSchemaType} from './MenuItem'
import {DEFAULT_SELECTED_ORDERING_OPTION} from './Sort'
import {DocumentListBuilder} from './DocumentList'
import {ListItemBuilder, ListItem} from './ListItem'
import {DocumentTypeListBuilder, DocumentTypeListInput} from './DocumentTypeList'
import {defaultIntentChecker} from './Intent'
import {List} from './List'
import {Collection} from './StructureNodes'
import {StructureContext} from './types'

function shouldShowIcon(schemaType: SchemaType): boolean {
  const preview = schemaType.preview
  return Boolean(preview && (preview.prepare || (preview.select && preview.select.media)))
}

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

export function getDocumentTypes({schema}: StructureContext): string[] {
  return schema
    .getTypeNames()
    .filter((n) => {
      const schemaType = schema.get(n)
      return schemaType && isDocumentType(schemaType)
    })
    .filter((n) => !isBundledDocType(n))
}

export function getDocumentTypeListItems(context: StructureContext): ListItemBuilder[] {
  const types = getDocumentTypes(context)
  return types.map((typeName) => getDocumentTypeListItem(context, typeName))
}

export function getDocumentTypeListItem(
  context: StructureContext,
  typeName: string
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
  typeNameOrSpec: string | DocumentTypeListInput
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

  const title = type.title || startCase(typeName)
  const showIcons = shouldShowIcon(type)

  return new DocumentTypeListBuilder(context)
    .id(spec.id || typeName)
    .title(spec.title || title)
    .filter('_type == $type')
    .params({type: typeName})
    .schemaType(type)
    .showIcons(showIcons)
    .defaultOrdering(DEFAULT_SELECTED_ORDERING_OPTION.by)
    .menuItemGroups(
      spec.menuItemGroups || [
        {id: 'sorting', title: 'Sort'},
        {id: 'layout', title: 'Layout'},
        {id: 'actions', title: 'Actions'},
      ]
    )
    .child(
      spec.child ||
        ((documentId: string) => resolveDocumentNode({schemaType: typeName, documentId}))
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
          .title('Compact view')
          .icon(StackCompactIcon)
          .action('setLayout')
          .params({layout: 'default'}),

        new MenuItemBuilder(context)
          .group('layout')
          .title('Detailed view')
          .icon(StackIcon)
          .action('setLayout')
          .params({layout: 'detail'}),

        // Create new (from menu) will be added in serialization step of GenericList
      ]
    )
}
