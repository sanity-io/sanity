import {SanityClient} from '@sanity/client'
import {Template} from '@sanity/initial-value-templates'
import {Schema, SchemaType, SortOrdering} from '@sanity/types'
import {uniqueId} from 'lodash'
import {isValidElementType} from 'react-is'
import {ChildResolverContext, ChildResolverOptions} from './ChildResolver'
import {ComponentInput, ComponentBuilder} from './Component'
import {
  DocumentBuilder,
  PartialDocumentNode,
  documentFromEditor,
  documentFromEditorWithInitialValue,
  getDefaultDocumentNode,
} from './Document'
import {DocumentListBuilder, DocumentListInput} from './DocumentList'
import {DocumentListItemBuilder, DocumentListItemInput} from './DocumentListItem'
import {DocumentTypeListInput} from './DocumentTypeList'
import {
  getDocumentTypeListItems,
  getDocumentTypeListItem,
  getDocumentTypeList,
} from './documentTypeListItems'
import {
  InitialValueTemplateItem,
  InitialValueTemplateItemBuilder,
  defaultInitialValueTemplateItems,
  menuItemsFromInitialValueTemplateItems,
} from './InitialValueTemplateItem'
import {ListBuilder, ListInput} from './List'
import {ListItemBuilder, ListItemInput} from './ListItem'
import {
  MenuItemBuilder,
  MenuItem,
  getOrderingMenuItemsForSchemaType,
  getOrderingMenuItem,
} from './MenuItem'
import {MenuItemGroup, MenuItemGroupBuilder} from './MenuItemGroup'
import {Divider} from './StructureNodes'
import {DocumentNodeResolver, StructureBuilder, UserComponent} from './types'
import * as views from './views'

export function createStructureBuilder(opts: {
  client: SanityClient
  initialValueTemplates: Template[]
  resolveStructureDocumentNode?: DocumentNodeResolver
  schema: Schema
  source?: string
}): StructureBuilder {
  const {client, initialValueTemplates, resolveStructureDocumentNode, schema, source} = opts

  const builder: StructureBuilder = {
    component(specOrComponent?: ComponentInput | UserComponent) {
      return isValidElementType(specOrComponent)
        ? new ComponentBuilder().component(specOrComponent as UserComponent)
        : new ComponentBuilder(specOrComponent as ComponentInput)
    },
    defaults() {
      return getDefaultStructure(resolverContext)
    },
    documentTypeList(typeNameOrSpec: string | DocumentTypeListInput) {
      return getDocumentTypeList(resolverContext, typeNameOrSpec)
    },
    documentTypeListItem(typeName: string) {
      return getDocumentTypeListItem(resolverContext, typeName)
    },
    documentTypeListItems() {
      return getDocumentTypeListItems(resolverContext)
    },
    document(spec?: PartialDocumentNode) {
      return new DocumentBuilder(spec)
    },
    documentList(spec?: DocumentListInput) {
      return new DocumentListBuilder(schema, initialValueTemplates, spec)
    },
    documentListItem(spec?: DocumentListItemInput) {
      return new DocumentListItemBuilder(schema, spec)
    },
    documentWithInitialValueTemplate(templateId: string, parameters: ChildResolverOptions) {
      return documentFromEditorWithInitialValue(resolverContext, templateId, parameters)
    },
    defaultDocument(options) {
      return getDefaultDocumentNode(resolverContext, options)
    },
    list(spec?: ListInput) {
      return new ListBuilder(spec)
    },
    listItem(spec?: ListItemInput) {
      return new ListItemBuilder(schema, spec)
    },
    menuItem(spec?: MenuItem) {
      return new MenuItemBuilder(spec)
    },
    menuItemGroup(spec?: MenuItemGroup) {
      return new MenuItemGroupBuilder(spec)
    },
    menuItemsFromInitialValueTemplateItems(templateItems: InitialValueTemplateItem[]) {
      return menuItemsFromInitialValueTemplateItems(schema, initialValueTemplates, templateItems)
    },
    orderingMenuItem(ordering: SortOrdering) {
      return getOrderingMenuItem(ordering)
    },
    orderingMenuItemsForType(type: string) {
      return getOrderingMenuItemsForSchemaType(schema, type)
    },
    editor(options) {
      return documentFromEditor(resolverContext, options)
    },
    defaultInitialValueTemplateItems() {
      return defaultInitialValueTemplateItems(builder, schema, initialValueTemplates)
    },
    initialValueTemplateItem(
      templateId: string,
      parameters?: Record<string, any>
    ): InitialValueTemplateItemBuilder {
      return new InitialValueTemplateItemBuilder({
        id: templateId,
        parameters,
        templateId,
      })
    },
    divider(): Divider {
      return {id: uniqueId('__divider__'), type: 'divider'}
    },
    view: views,

    get _resolverContext() {
      return resolverContext
    },
  }

  const resolverContext: ChildResolverContext = {
    client,
    schema,
    source,
    structureBuilder: builder,
    resolveStructureDocumentNode,
    templates: initialValueTemplates,
  }

  return builder
}

function hasIcon(schemaType?: SchemaType | string): boolean {
  if (!schemaType || typeof schemaType === 'string') {
    return false
  }

  return Boolean(schemaType.icon)
}

function getDefaultStructure(context: ChildResolverContext): ListBuilder {
  const items = getDocumentTypeListItems(context)

  return new ListBuilder()
    .source(context.source)
    .id('__root__')
    .title('Content')
    .items(items)
    .showIcons(items.some((item) => hasIcon(item.getSchemaType())))
}
