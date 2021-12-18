import {SplitHorizontalIcon, StackCompactIcon} from '@sanity/icons'
import {SchemaType} from '@sanity/types'
import {MenuItemBuilder, getOrderingMenuItemsForSchemaType} from './MenuItem'
import {DEFAULT_SELECTED_ORDERING_OPTION} from './Sort'
import {DocumentListBuilder} from './DocumentList'
import {ListItemBuilder, ListItem} from './ListItem'
import {DocumentTypeListBuilder, DocumentTypeListInput} from './DocumentTypeList'
import {defaultIntentChecker} from './Intent'
import {getDefaultDocumentNode} from './Document'
import {isList} from './List'
import {Collection} from './StructureNodes'
import {getSchemaTypes} from './helpers'
import {ChildResolverContext} from './ChildResolver'

function shouldShowIcon(schemaType: SchemaType): boolean {
  const preview = schemaType.preview
  return Boolean(preview && (preview.prepare || (preview.select && preview.select.media)))
}

export function getDocumentTypeListItems(context: ChildResolverContext): ListItemBuilder[] {
  const schemaTypes = getSchemaTypes(context.schema)

  return schemaTypes.map((typeName) => getDocumentTypeListItem(context, typeName))
}

export function getDocumentTypeListItem(
  context: ChildResolverContext,
  typeName: string
): ListItemBuilder {
  const type = context.schema.get(typeName)

  if (!type) {
    throw new Error(`Schema type with name "${typeName}" not found`)
  }

  return new ListItemBuilder(context.schema)
    .id(typeName)
    .title(type.title || type.name || 'Untitled')
    .schemaType(type)
    .child((_context, id, __context) => {
      const parent = __context.parent as Collection
      const parentItem = isList(parent)
        ? (parent.items.find((item) => item.id === id) as ListItem)
        : null

      let list = getDocumentTypeList(_context, typeName)
      if (parentItem && parentItem.title) {
        list = list.title(parentItem.title)
      }

      return list
    })
}

export function getDocumentTypeList(
  context: ChildResolverContext,
  // schema: Schema,
  // templates: Template[],
  typeNameOrSpec: string | DocumentTypeListInput
): DocumentListBuilder {
  const schemaType = typeof typeNameOrSpec === 'string' ? typeNameOrSpec : typeNameOrSpec.schemaType
  const typeName = typeof schemaType === 'string' ? schemaType : schemaType.name
  const spec: DocumentTypeListInput =
    typeof typeNameOrSpec === 'string' ? {schemaType} : typeNameOrSpec

  const type = context.schema.get(typeName)
  if (!type) {
    throw new Error(`Schema type with name "${typeName}" not found`)
  }

  const showIcons = shouldShowIcon(type)

  return new DocumentTypeListBuilder(context.schema, context.templates)
    .id(spec.id || typeName)
    .title(spec.title || type.title || type.name || 'Untitled')
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
        ((_context, documentId) =>
          getDefaultDocumentNode(_context, {schemaType: typeName, documentId}))
    )
    .canHandleIntent(spec.canHandleIntent || defaultIntentChecker)
    .menuItems(
      spec.menuItems || [
        // Create new (from action button) will be added in serialization step of GenericList

        // Sort by <Y>
        ...getOrderingMenuItemsForSchemaType(context.schema, type),

        // Display as <Z>
        new MenuItemBuilder()
          .group('layout')
          .title('Compact view')
          .icon(StackCompactIcon)
          .action('setLayout')
          .params({layout: 'default'}),

        new MenuItemBuilder()
          .group('layout')
          .title('Detailed view')
          .icon(SplitHorizontalIcon)
          .action('setLayout')
          .params({layout: 'detail'}),

        // Create new (from menu) will be added in serialization step of GenericList
      ]
    )
}
