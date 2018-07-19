import memoizeOne from 'memoize-one'
import {Schema, defaultSchema, SchemaType} from './parts/Schema'
import {dataAspects, DataAspectsResolver} from './parts/DataAspects'
import {ListItemBuilder} from './ListItem'
import {DocumentListBuilder} from './DocumentList'
import {MenuItemBuilder} from './MenuItem'
import {DEFAULT_ORDERING_OPTIONS, DEFAULT_SELECTED_ORDERING_OPTION} from './Sort'
import {getPlusIcon, getSortIcon, getListIcon} from './parts/Icon'
import {EditorBuilder} from './Editor'

const PlusIcon = getPlusIcon()
const SortIcon = getSortIcon()
const ListIcon = getListIcon()

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
    .child(getDocumentList(name, title, type))
}

function getDocumentList(name: string, title: string, type: SchemaType): DocumentListBuilder {
  return new DocumentListBuilder()
    .id(name)
    .title(title)
    .filter('_type == $type')
    .params({type: name})
    .schemaTypeName(name)
    .defaultOrdering(DEFAULT_SELECTED_ORDERING_OPTION.by)
    .canHandleIntent(
      (intentName, params): boolean =>
        Boolean(intentName === 'edit' && params && params.id) ||
        Boolean(intentName === 'create' && params && params.type === name)
    )
    .menuItemGroups([
      {id: 'sorting', title: 'Sort'},
      {id: 'layout', title: 'Layout'},
      {id: 'actions', title: 'Actions'}
    ])
    .childResolver((documentId: string) =>
      new EditorBuilder()
        .id('editor')
        .type(name)
        .documentId(documentId)
    )
    .menuItems([
      // Create new (from action button)
      new MenuItemBuilder()
        .title(`Create new ${title}`)
        .icon(PlusIcon)
        .intent({type: 'create', params: {type: name}})
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
        .icon(ListIcon)
        .action('setLayout')
        .params({layout: 'detail'}),

      // Create new (from menu)
      new MenuItemBuilder()
        .group('actions')
        .title('Create new…')
        .icon(PlusIcon)
        .intent({type: 'create', params: {type: name}})
    ])
}

function getOrderingMenuItemsForSchemaType(type: SchemaType) {
  return (type.orderings
    ? type.orderings.concat(DEFAULT_ORDERING_OPTIONS)
    : DEFAULT_ORDERING_OPTIONS
  ).map(ordering =>
    new MenuItemBuilder()
      .group('sorting')
      .title(`Sort by ${ordering.title}`)
      .icon(SortIcon)
      .action('setSortOrder')
      .params({by: ordering.by})
  )
}
