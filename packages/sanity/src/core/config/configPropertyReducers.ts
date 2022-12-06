import type {AssetSource, SchemaTypeDefinition} from '@sanity/types'
import type {Template, TemplateResponse} from '../templates'
import {DocumentActionComponent} from './document/actions'
import {DocumentBadgeComponent} from './document/badges'
import type {
  DocumentLanguageFilterComponent,
  DocumentLanguageFilterContext,
  AsyncConfigPropertyReducer,
  ConfigContext,
  ConfigPropertyReducer,
  DocumentActionsContext,
  DocumentBadgesContext,
  NewDocumentOptionsContext,
  ResolveProductionUrlContext,
  Tool,
} from './types'
import {SearchFilterDefinition} from '../studio/components/navbar/search/definitions/filters'
import {SearchOperatorDefinition} from '../studio/components/navbar/search/definitions/operators'

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
    `Expected \`schema.types\` to an array or a function but found ${typeof schemaTypes} instead.`
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

  throw new Error(`Expected \`tools\` to an array or a function but found ${typeof tools} instead.`)
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
    `Expected \`filters\` to be an array or a function but found ${typeof filters} instead.`
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
    `Expected \`operators\` to be an array or a function but found ${typeof operators} instead.`
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
    `Expected \`schema.templates\` to an array or a function but found ${typeof schemaTemplates} instead.`
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
    `Expected \`document.actions\` to an array or a function but found ${typeof documentBadges} instead.`
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
    `Expected \`document.actions\` to an array or a function but found ${typeof documentActions} instead.`
  )
}

export const newDocumentOptionsResolver: ConfigPropertyReducer<
  TemplateResponse[],
  NewDocumentOptionsContext
> = (prev, {document}, context) => {
  const resolveNewDocumentOptions = document?.newDocumentOptions
  if (!resolveNewDocumentOptions) return prev

  if (typeof resolveNewDocumentOptions !== 'function') {
    throw new Error(
      `Expected \`document.resolveNewDocumentOptions\` a function but found ${typeof resolveNewDocumentOptions} instead.`
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
    `Expected \`file.assetSources\` to an array or a function but found ${typeof assetSources} instead.`
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
    `Expected \`image.assetSources\` to an array or a function but found ${typeof assetSources} instead.`
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
    `Expected \`document.actions\` to an array or a function but found ${typeof resolveDocumentLanguageFilter} instead.`
  )
}
