import memoizeOne from 'memoize-one'
import {Schema, getDefaultSchema, SchemaType} from './parts/Schema'
import {dataAspects, DataAspectsResolver} from './parts/DataAspects'
import {getListIcon, getDetailsIcon} from './parts/Icon'
import {MenuItemBuilder, getOrderingMenuItemsForSchemaType} from './MenuItem'
import {DEFAULT_SELECTED_ORDERING_OPTION} from './Sort'
import {DocumentListBuilder} from './DocumentList'
import {ListItemBuilder} from './ListItem'
import {EditorBuilder} from './Editor'
import {DocumentTypeListBuilder} from './DocumentTypeList'
import {defaultIntentChecker} from './Intent'

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
  return types.map(typeName => getDocumentTypeListItem(typeName, schema))
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
    .child(getDocumentTypeList(typeName, schema))
}

export function getDocumentTypeList(typeName: string, sanitySchema?: Schema): DocumentListBuilder {
  const schema = sanitySchema || getDefaultSchema()
  const type = schema.get(typeName)
  if (!type) {
    throw new Error(`Schema type with name "${typeName}" not found`)
  }

  const resolver = getDataAspectsForSchema(schema)
  const title = resolver.getDisplayName(typeName)
  const showIcons = shouldShowIcon(type)

  return new DocumentTypeListBuilder()
    .id(typeName)
    .title(title)
    .filter('_type == $type')
    .params({type: typeName})
    .schemaType(type)
    .showIcons(showIcons)
    .defaultOrdering(DEFAULT_SELECTED_ORDERING_OPTION.by)
    .menuItemGroups([
      {id: 'sorting', title: 'Sort'},
      {id: 'layout', title: 'Layout'},
      {id: 'actions', title: 'Actions'}
    ])
    .child((documentId: string) =>
      new EditorBuilder()
        .id('editor')
        .schemaType(type)
        .documentId(documentId)
    )
    .canHandleIntent(defaultIntentChecker)
    .menuItems([
      // Create new (from action button) will be added in serialization step of GenericList

      // Sort by <Y>
      ...getOrderingMenuItemsForSchemaType(type),

      // Display as <Z>
      new MenuItemBuilder()
        .group('layout')
        .title('List')
        .icon(ListIcon)
        .action('setLayout')
        .params({layout: 'default'}),

      new MenuItemBuilder()
        .group('layout')
        .title('Details')
        .icon(DetailsIcon)
        .action('setLayout')
        .params({layout: 'detail'})

      // Create new (from menu) will be added in serialization step of GenericList
    ])
}
