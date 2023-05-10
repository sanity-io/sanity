import type {AssetSource, SchemaTypeDefinition} from '@sanity/types'
import type {InitOptions} from 'i18next'
import {getPrintableType} from '../util/getPrintableType'
import type {Template, TemplateItem} from '../templates'
import type {DocumentActionComponent, DocumentBadgeComponent, DocumentInspector} from './document'
import type {
  AsyncConfigPropertyReducer,
  ConfigContext,
  ConfigPropertyReducer,
  DocumentActionsContext,
  DocumentBadgesContext,
  DocumentInspectorContext,
  DocumentLanguageFilterComponent,
  DocumentLanguageFilterContext,
  I18nContext,
  LanguageDefinition,
  LanguageLoader,
  NewDocumentOptionsContext,
  ResolveProductionUrlContext,
  Tool,
} from './types'

export const initialDocumentBadges: DocumentBadgeComponent[] = []

export const initialDocumentActions: DocumentActionComponent[] = []

export const initialLanguageFilter: DocumentLanguageFilterComponent[] = []

export const schemaTypesReducer: ConfigPropertyReducer<
  SchemaTypeDefinition[],
  Omit<ConfigContext, 'schema' | 'currentUser' | 'client' | 'getClient'>
> = (prev, {schema}, context) => {
  const schemaTypes = schema?.types

  if (!schemaTypes) return prev
  if (typeof schemaTypes === 'function') return schemaTypes(prev, context)
  if (Array.isArray(schemaTypes)) return [...prev, ...schemaTypes]

  throw new Error(
    `Expected \`schema.types\` to be an array or a function, but received ${getPrintableType(
      schemaTypes
    )}`
  )
}

export const resolveProductionUrlReducer: AsyncConfigPropertyReducer<
  string | undefined,
  ResolveProductionUrlContext
> = async (prev, {document}, context) => {
  const resolveProductionUrl = document?.productionUrl
  // the redundant await is useful for error logging because the error is caught
  // in this stack vs somewhere down stream
  // eslint-disable-next-line no-return-await
  if (resolveProductionUrl) return await resolveProductionUrl(prev, context)
  return prev
}

export const toolsReducer: ConfigPropertyReducer<Tool[], ConfigContext> = (
  prev,
  {tools},
  context
) => {
  if (!tools) return prev
  if (typeof tools === 'function') return tools(prev, context)
  if (Array.isArray(tools)) return [...prev, ...tools]

  throw new Error(
    `Expected \`tools\` to be an array or a function, but received ${getPrintableType(tools)}`
  )
}

// we will need this when we ressurect user config for search
/*export const searchFilterReducer: ConfigPropertyReducer<
  SearchFilterDefinition<string>[],
  ConfigContext
> = (prev, {search}, context) => {
  const filters = search?.filters
  if (!filters) return prev
  if (typeof filters === 'function') return filters(prev, context)
  if (Array.isArray(filters)) return [...prev, ...filters]

  throw new Error(
    `Expected \`search.filters\` to be an array or a function, but received ${typeof filters}`
  )
}

export const searchOperatorsReducer: ConfigPropertyReducer<
  SearchOperatorDefinition[],
  ConfigContext
> = (prev, {search}, context) => {
  const operators = search?.operators
  if (!operators) return prev
  if (typeof operators === 'function') return operators(prev, context)
  if (Array.isArray(operators)) return [...prev, ...operators]

  throw new Error(
    `Expected \`operators\` to be be an array or a function, but received ${getPrintableType(operators)}`
  )
}*/

export const schemaTemplatesReducer: ConfigPropertyReducer<Template[], ConfigContext> = (
  prev,
  {schema},
  context
) => {
  const schemaTemplates = schema?.templates
  if (!schemaTemplates) return prev
  if (typeof schemaTemplates === 'function') return schemaTemplates(prev, context)
  if (Array.isArray(schemaTemplates)) return [...prev, ...schemaTemplates]

  throw new Error(
    `Expected \`schema.templates\` to be an array or a function, but received ${getPrintableType(
      schemaTemplates
    )}`
  )
}

export const i18nOptionsReducer: ConfigPropertyReducer<InitOptions, I18nContext> = (
  prev,
  {i18n},
  context
) => {
  const initOptions = i18n?.initOptions
  if (!initOptions) return prev
  if (typeof initOptions === 'function') return initOptions(prev, context)

  throw new Error(
    `Expected \`i18n.initOptions\` to be a function, but received ${typeof initOptions}`
  )
}

export const i18nLoaderReducer: ConfigPropertyReducer<LanguageLoader[], I18nContext> = (
  prev,
  {i18n},
  context
) => {
  const languageLoaders = i18n?.languageLoaders
  if (!languageLoaders) return prev
  if (typeof languageLoaders === 'function') return languageLoaders(prev, context)
  if (Array.isArray(languageLoaders)) return [...prev, ...languageLoaders]

  throw new Error(
    `Expected \`i18n.languageLoaders\` to be an array or a function, but received ${typeof languageLoaders}`
  )
}

export const i18nLangDefReducer: ConfigPropertyReducer<LanguageDefinition[], I18nContext> = (
  prev,
  {i18n},
  context
) => {
  const languages = i18n?.languages
  if (!languages) return prev
  if (typeof languages === 'function') return languages(prev, context)
  if (Array.isArray(languages)) return [...prev, ...languages]

  throw new Error(
    `Expected \`i18n.languages\` to be an array or a function, but received ${typeof languages}`
  )
}

export const documentBadgesReducer: ConfigPropertyReducer<
  DocumentBadgeComponent[],
  DocumentBadgesContext
> = (prev, {document}, context) => {
  const documentBadges = document?.badges
  if (!documentBadges) return prev

  if (typeof documentBadges === 'function') return documentBadges(prev, context)
  if (Array.isArray(documentBadges)) return [...prev, ...documentBadges]

  throw new Error(
    `Expected \`document.badges\` to be an array or a function, but received ${getPrintableType(
      documentBadges
    )}`
  )
}

export const documentActionsReducer: ConfigPropertyReducer<
  DocumentActionComponent[],
  DocumentActionsContext
> = (prev, {document}, context) => {
  const documentActions = document?.actions
  if (!documentActions) return prev

  if (typeof documentActions === 'function') return documentActions(prev, context)
  if (Array.isArray(documentActions)) return [...prev, ...documentActions]

  throw new Error(
    `Expected \`document.actions\` to be an array or a function, but received ${getPrintableType(
      documentActions
    )}`
  )
}

export const newDocumentOptionsResolver: ConfigPropertyReducer<
  TemplateItem[],
  NewDocumentOptionsContext
> = (prev, {document}, context) => {
  const resolveNewDocumentOptions = document?.newDocumentOptions
  if (!resolveNewDocumentOptions) return prev

  if (typeof resolveNewDocumentOptions !== 'function') {
    throw new Error(
      `Expected \`document.resolveNewDocumentOptions\` to be a function, but received ${getPrintableType(
        resolveNewDocumentOptions
      )}`
    )
  }

  return resolveNewDocumentOptions(prev, context)
}

export const fileAssetSourceResolver: ConfigPropertyReducer<AssetSource[], ConfigContext> = (
  prev,
  {form},
  context
) => {
  const assetSources = form?.file?.assetSources
  if (!assetSources) return prev

  if (typeof assetSources === 'function') return assetSources(prev, context)
  if (Array.isArray(assetSources)) return [...prev, ...assetSources]

  throw new Error(
    `Expected \`form.file.assetSources\` to be an array or a function, but received ${getPrintableType(
      assetSources
    )}`
  )
}

export const imageAssetSourceResolver: ConfigPropertyReducer<AssetSource[], ConfigContext> = (
  prev,
  {form},
  context
) => {
  const assetSources = form?.image?.assetSources
  if (!assetSources) return prev

  if (typeof assetSources === 'function') return assetSources(prev, context)
  if (Array.isArray(assetSources)) return [...prev, ...assetSources]

  throw new Error(
    `Expected \`form.image.assetSources\` to be an array or a function, but received ${getPrintableType(
      assetSources
    )}`
  )
}

/**
 * @internal
 */
export const documentLanguageFilterReducer: ConfigPropertyReducer<
  DocumentLanguageFilterComponent[],
  DocumentLanguageFilterContext
> = (prev, {document}, context) => {
  const resolveDocumentLanguageFilter = document?.unstable_languageFilter
  if (!resolveDocumentLanguageFilter) return prev

  if (typeof resolveDocumentLanguageFilter === 'function')
    return resolveDocumentLanguageFilter(prev, context)

  if (Array.isArray(resolveDocumentLanguageFilter))
    return [...prev, ...resolveDocumentLanguageFilter]

  throw new Error(
    `Expected \`document.unstable_languageFilter\` to be an array or a function, but received ${getPrintableType(
      resolveDocumentLanguageFilter
    )}`
  )
}

export const documentInspectorsReducer: ConfigPropertyReducer<
  DocumentInspector[],
  DocumentInspectorContext
> = (prev, {document}, context) => {
  const resolveInspectorsFilter = document?.inspectors
  if (!resolveInspectorsFilter) return prev

  if (typeof resolveInspectorsFilter === 'function') return resolveInspectorsFilter(prev, context)

  if (Array.isArray(resolveInspectorsFilter)) return [...prev, ...resolveInspectorsFilter]

  throw new Error(
    `Expected \`document.inspectors\` to be an array or a function, but received ${getPrintableType(
      resolveInspectorsFilter
    )}`
  )
}
