import {Schema, defaultSchema} from './parts/schema'
import {dataAspects} from './parts/DataAspects'
import {ListItem, ListItemBuilder, SchemaType} from './ListItem'
import {DocumentList, DocumentListBuilder} from './DocumentList'
import {MenuItemBuilder} from './MenuItem'
import {DEFAULT_ORDERING_OPTIONS} from './Sort'
import {getPlusIcon, getSortIcon, getListIcon} from './parts/icon'
import {EditorBuilder} from './Editor'

const PlusIcon = getPlusIcon()
const SortIcon = getSortIcon()
const ListIcon = getListIcon()

export const getDocumentTypeListItems = (schema: Schema = defaultSchema): ListItem[] => {
  const resolver = dataAspects(schema)
  const types = resolver.getInferredTypes()

  return types.map(name => {
    const title = resolver.getDisplayName(name)
    const schemaType = schema.get(name)
    return getDocumentTypeListItem(name, title, schemaType)
  })
}

function getDocumentTypeListItem(name: string, title: string, type: SchemaType): ListItem {
  return new ListItemBuilder()
    .id(name)
    .title(title)
    .schemaType(type)
    .child(getDocumentList(name, title, type))
    .serialize()
}

function getDocumentList(name: string, title: string, type: SchemaType): DocumentList {
  return new DocumentListBuilder()
    .id(name)
    .title(title)
    .filter('_type == $type')
    .params({type: name})
    .defaultOrdering([]) // @todo
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
        .serialize()
    )
    .menuItems([
      // Create new (from action button)
      new MenuItemBuilder()
        .title(`Create new ${title}`)
        .icon(PlusIcon)
        .intent({type: 'create', params: {type: name}})
        .showAsAction(true),

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
    .serialize()
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
