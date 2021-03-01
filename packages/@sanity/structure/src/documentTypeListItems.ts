import memoizeOne from 'memoize-one'
import {Schema, getDefaultSchema, SchemaType} from './parts/Schema'
import {dataAspects, DataAspectsResolver} from './parts/DataAspects'
import {getListIcon, getDetailsIcon} from './parts/Icon'
import {MenuItemBuilder, getOrderingMenuItemsForSchemaType} from './MenuItem'
import {DEFAULT_SELECTED_ORDERING_OPTION} from './Sort'
import {DocumentListBuilder} from './DocumentList'
import {ListItemBuilder, ListItem} from './ListItem'
import {DocumentTypeListBuilder, DocumentTypeListInput} from './DocumentTypeList'
import {defaultIntentChecker} from './Intent'
import {getDefaultDocumentNode} from './Document'
import {isList} from './List'

const ListIcon = getListIcon()
const DetailsIcon = getDetailsIcon()

const getDataAspectsForSchema: (schema: Schema) => DataAspectsResolver = memoizeOne(dataAspects)

function shouldShowIcon(schemaType: SchemaType): boolean {
  const preview = schemaType.preview
  return Boolean(preview && (preview.prepare || (preview.select && preview.select.media)))
}

export function getDocumentTypeListItems(schema?: Schema): ListItemBuilder[] {
  const resolver = getDataAspectsForSchema(schema || getDefaultSchema())
  const types = resolver.getDocumentTypes()
  return types.map((typeName) => getDocumentTypeListItem(typeName, schema))
}

export function getDocumentTypeListItem(typeName: string, sanitySchema?: Schema): ListItemBuilder {
  const schema = sanitySchema || getDefaultSchema()
  const type = schema.get(typeName)
  if (!type) {
    throw new Error(`Schema type with name "${typeName}" not found`)
  }

  const resolver = getDataAspectsForSchema(schema)
  const title = resolver.getDisplayName(typeName)
  return new ListItemBuilder()
    .id(typeName)
    .title(title)
    .schemaType(type)
    .child((id, {parent}) => {
      const parentItem = isList(parent)
        ? (parent.items.find((item) => item.id === id) as ListItem)
        : null

      let list = getDocumentTypeList(typeName, schema)
      if (parentItem && parentItem.title) {
        list = list.title(parentItem.title)
      }

      return list
    })
}

export function getDocumentTypeList(
  typeNameOrSpec: string | DocumentTypeListInput,
  sanitySchema?: Schema
): DocumentListBuilder {
  const schemaType = typeof typeNameOrSpec === 'string' ? typeNameOrSpec : typeNameOrSpec.schemaType
  const typeName = typeof schemaType === 'string' ? schemaType : schemaType.name
  const spec: DocumentTypeListInput =
    typeof typeNameOrSpec === 'string' ? {schemaType} : typeNameOrSpec

  const schema = sanitySchema || getDefaultSchema()
  const type = schema.get(typeName)
  if (!type) {
    throw new Error(`Schema type with name "${typeName}" not found`)
  }

  const resolver = getDataAspectsForSchema(schema)
  const title = resolver.getDisplayName(typeName)
  const showIcons = shouldShowIcon(type)

  return new DocumentTypeListBuilder()
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
        ((documentId: string) => getDefaultDocumentNode({schemaType: typeName, documentId}))
    )
    .canHandleIntent(spec.canHandleIntent || defaultIntentChecker)
    .menuItems(
      spec.menuItems || [
        // Create new (from action button) will be added in serialization step of GenericList

        // Sort by <Y>
        ...getOrderingMenuItemsForSchemaType(type),

        // Display as <Z>
        new MenuItemBuilder()
          .group('layout')
          .title('Compact view')
          .icon(ListIcon)
          .action('setLayout')
          .params({layout: 'default'}),

        new MenuItemBuilder()
          .group('layout')
          .title('Detailed view')
          .icon(DetailsIcon)
          .action('setLayout')
          .params({layout: 'detail'}),

        // Create new (from menu) will be added in serialization step of GenericList
      ]
    )
}
