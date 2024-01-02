import {uniqueId} from 'lodash'
import type {SchemaType} from '@sanity/types'
import {isValidElementType} from 'react-is'
import {structureLocaleNamespace} from '../i18n'
import {ListBuilder} from './List'
import {
  getDocumentTypeListItems,
  getDocumentTypeListItem,
  getDocumentTypeList,
} from './documentTypeListItems'
import {MenuItemBuilder, getOrderingMenuItemsForSchemaType, getOrderingMenuItem} from './MenuItem'
import {ListItemBuilder} from './ListItem'
import {MenuItemGroupBuilder} from './MenuItemGroup'
import {DocumentListBuilder} from './DocumentList'
import type {Divider} from './StructureNodes'
import {DocumentBuilder, documentFromEditor, documentFromEditorWithInitialValue} from './Document'
import {ComponentInput, ComponentBuilder} from './Component'
import {DocumentListItemBuilder} from './DocumentListItem'
import * as views from './views'
import {
  InitialValueTemplateItemBuilder,
  defaultInitialValueTemplateItems,
  menuItemsFromInitialValueTemplateItems,
} from './InitialValueTemplateItem'
import type {
  StructureBuilder,
  UserComponent,
  StructureContext,
  DefaultDocumentNodeResolver,
} from './types'
import {Source, getConfigContextFromSource, getPublishedId} from 'sanity'

/** @internal */
export interface StructureBuilderOptions {
  source: Source
  defaultDocumentNode?: DefaultDocumentNodeResolver
}

function hasIcon(schemaType?: SchemaType | string): boolean {
  if (!schemaType || typeof schemaType === 'string') {
    return false
  }

  return Boolean(schemaType.icon)
}

function getDefaultStructure(context: StructureContext): ListBuilder {
  const items = getDocumentTypeListItems(context)
  return new ListBuilder(context)
    .id('__root__')
    .title('Content')
    .i18n({title: {key: 'default-definition.content-title', ns: structureLocaleNamespace}})
    .items(items)
    .showIcons(items.some((item) => hasIcon(item.getSchemaType())))
}

/** @internal */
export function createStructureBuilder({
  defaultDocumentNode,
  source,
}: StructureBuilderOptions): StructureBuilder {
  const configContext = getConfigContextFromSource(source)
  const context: StructureContext = {
    ...source,
    getStructureBuilder: () => structureBuilder,
    resolveDocumentNode: (options) => {
      let builder =
        defaultDocumentNode?.(structureBuilder, {...options, ...configContext}) ||
        new DocumentBuilder(context)

      if (!builder.getId()) {
        builder = builder.id('documentEditor')
      }

      if (options.documentId) {
        builder = builder.documentId(getPublishedId(options.documentId))
      }

      return builder.schemaType(options.schemaType)
    },
  }

  const structureBuilder: StructureBuilder = {
    defaults: () => getDefaultStructure(context),
    documentTypeList: (...args) => getDocumentTypeList(context, ...args),
    documentTypeListItem: (...args) => getDocumentTypeListItem(context, ...args),
    documentTypeListItems: (...args) => getDocumentTypeListItems(context, ...args),
    document: (...args) => new DocumentBuilder(context, ...args),
    documentWithInitialValueTemplate: (...args) =>
      documentFromEditorWithInitialValue(context, ...args),
    defaultDocument: context.resolveDocumentNode,

    list: (...args) => new ListBuilder(context, ...args),
    listItem: (...args) => new ListItemBuilder(context, ...args),

    menuItem: (...args) => new MenuItemBuilder(context, ...args),
    menuItemGroup: (...args) => new MenuItemGroupBuilder(context, ...args),
    menuItemsFromInitialValueTemplateItems: (...args) =>
      menuItemsFromInitialValueTemplateItems(context, ...args),

    documentList: (...args) => new DocumentListBuilder(context, ...args),
    documentListItem: (...args) => new DocumentListItemBuilder(context, ...args),

    orderingMenuItem: (...args) => getOrderingMenuItem(context, ...args),
    orderingMenuItemsForType: (...args) => getOrderingMenuItemsForSchemaType(context, ...args),

    editor: (...args) => documentFromEditor(context, ...args),

    defaultInitialValueTemplateItems: (...args) =>
      defaultInitialValueTemplateItems(context, ...args),

    initialValueTemplateItem: (
      templateId: string,
      parameters?: Record<string, unknown>,
    ): InitialValueTemplateItemBuilder =>
      new InitialValueTemplateItemBuilder(context, {
        id: templateId,
        parameters,
        templateId,
      }),

    component: (spec?: ComponentInput | UserComponent) => {
      return isValidElementType(spec)
        ? new ComponentBuilder().component(spec as UserComponent)
        : new ComponentBuilder(spec as ComponentInput)
    },

    divider: (): Divider => ({id: uniqueId('__divider__'), type: 'divider'}),

    view: views,
    context,
  }

  return structureBuilder
}
