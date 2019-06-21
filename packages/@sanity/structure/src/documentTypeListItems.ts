import memoizeOne from 'memoize-one'
import {getTemplates} from '@sanity/base/initial-values'
import {Schema, getDefaultSchema, SchemaType} from './parts/Schema'
import {dataAspects, DataAspectsResolver} from './parts/DataAspects'
import {getPlusIcon, getListIcon, getDetailsIcon} from './parts/Icon'
import {MenuItemBuilder, getOrderingMenuItemsForSchemaType} from './MenuItem'
import {DEFAULT_SELECTED_ORDERING_OPTION} from './Sort'
import {DocumentListBuilder} from './DocumentList'
import {ListItemBuilder} from './ListItem'
import {EditorBuilder} from './Editor'
import {isActionEnabled} from './parts/documentActionUtils'
import {DocumentTypeListBuilder} from './DocumentTypeList'
import {IntentChecker} from './Intent'
import {Template} from './templates/Template'
import {ChildResolverOptions} from './ChildResolver'

const PlusIcon = getPlusIcon()
const ListIcon = getListIcon()
const DetailsIcon = getDetailsIcon()

const getDataAspectsForSchema: (schema: Schema) => DataAspectsResolver = memoizeOne(dataAspects)

const paneCanHandleTemplateCreation = (templateId: string, paneSchemaType: string): boolean => {
  if (!templateId) {
    return false
  }

  const templates = getTemplates() as Template[]
  const template = templates.find(tpl => tpl.id === templateId)
  return template ? template.schemaType === paneSchemaType : false
}

export const DEFAULT_INTENT_HANDLER = Symbol('Document type list canHandleIntent')

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
  const canCreate = isActionEnabled(type, 'create')

  const intentChecker: IntentChecker = (intentName, params = {}): boolean =>
    Boolean(intentName === 'edit' && params.id && params.type === typeName) ||
    Boolean(intentName === 'create' && params.type === typeName) ||
    Boolean(intentName === 'create' && paneCanHandleTemplateCreation(params.template, typeName))

  intentChecker.identity = DEFAULT_INTENT_HANDLER

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
    .child((documentId: string, context: ChildResolverOptions) => {
      const params = context.parameters || {}
      const {template, ...parameters} = params
      const editor = new EditorBuilder()
        .id('editor')
        .schemaType(type)
        .documentId(documentId)
        .parameters(parameters)

      return typeof template === 'string' ? editor.template(template) : editor
    })
    .canHandleIntent(intentChecker)
    .menuItems([
      // Create new (from action button)
      ...(canCreate
        ? [
            new MenuItemBuilder()
              .title(`Create new ${title}`)
              .icon(PlusIcon)
              .intent({type: 'create', params: {type: typeName}})
              .showAsAction({whenCollapsed: true})
          ]
        : []),

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
      ...(canCreate
        ? [
            new MenuItemBuilder()
              .group('actions')
              .title('Create new…')
              .icon(PlusIcon)
              .intent({type: 'create', params: {type: typeName}})
          ]
        : [])
    ])
}
