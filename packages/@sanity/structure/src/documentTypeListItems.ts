import memoizeOne from 'memoize-one'
import {Schema, defaultSchema} from './parts/Schema'
import {dataAspects, DataAspectsResolver} from './parts/DataAspects'
import {getPlusIcon, getListIcon, getDetailsIcon} from './parts/Icon'
import {MenuItemBuilder, getOrderingMenuItemsForSchemaType} from './MenuItem'
import {DEFAULT_SELECTED_ORDERING_OPTION} from './Sort'
import {DocumentListBuilder} from './DocumentList'
import {ListItemBuilder} from './ListItem'
import {EditorBuilder} from './Editor'

const PlusIcon = getPlusIcon()
const ListIcon = getListIcon()
const DetailsIcon = getDetailsIcon()

const getDataAspectsForSchema: (schema: Schema) => DataAspectsResolver = memoizeOne(dataAspects)

export function getDocumentTypeListItems(schema: Schema = defaultSchema): ListItemBuilder[] {
  const resolver = getDataAspectsForSchema(schema)
  const types = resolver.getInferredTypes()
  return types.map(name => getDocumentTypeListItem(name, schema))
}

export function getDocumentTypeListItem(
  name: string,
  schema: Schema = defaultSchema
): ListItemBuilder {
  const type = schema.get(name)
  const resolver = getDataAspectsForSchema(schema)
  const title = resolver.getDisplayName(name)
  return new ListItemBuilder()
    .id(name)
    .title(title)
    .schemaType(type)
    .child(getDocumentTypeList(name, schema))
}

export function getDocumentTypeList(
  typeName: string,
  schema: Schema = defaultSchema
): DocumentListBuilder {
  const type = schema.get(typeName)
  const resolver = getDataAspectsForSchema(schema)
  const title = resolver.getDisplayName(typeName)
  return new DocumentListBuilder()
    .id(typeName)
    .title(title)
    .filter('_type == $type')
    .params({type: typeName})
    .schemaType(type)
    .defaultOrdering(DEFAULT_SELECTED_ORDERING_OPTION.by)
    .canHandleIntent(
      (intentName, params): boolean =>
        Boolean(intentName === 'edit' && params && params.id && params.type === typeName) ||
        Boolean(intentName === 'create' && params && params.type === typeName)
    )
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
    .menuItems([
      // Create new (from action button)
      new MenuItemBuilder()
        .title(`Create new ${title}`)
        .icon(PlusIcon)
        .intent({type: 'create', params: {type: typeName}})
        .showAsAction({whenCollapsed: true}),

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
        .params({layout: 'detail'}),

      // Create new (from menu)
      new MenuItemBuilder()
        .group('actions')
        .title('Create new…')
        .icon(PlusIcon)
        .intent({type: 'create', params: {type: typeName}})
    ])
}
