import type {AssetSource, SchemaTypeDefinition} from '@sanity/types'
import type {Template, TemplateResponse} from '../templates'
import {DocumentActionComponent, DocumentBadgeComponent, DocumentInspector} from './document'
import type {
  DocumentLanguageFilterComponent,
  DocumentLanguageFilterContext,
  AsyncConfigPropertyReducer,
  ConfigContext,
  ConfigPropertyReducer,
  DocumentActionsContext,
  DocumentBadgesContext,
  DocumentInspectorContext,
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
    `Expected \`schema.types\` to be an array or a function, but received ${typeof schemaTypes}`
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

  throw new Error(`Expected \`tools\` to be an array or a function, but received ${typeof tools}`)
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
    `Expected \`operators\` to be be an array or a function, but received ${typeof operators}`
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
    `Expected \`schema.templates\` to be an array or a function, but received ${typeof schemaTemplates}`
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
    `Expected \`document.badges\` to be an array or a function, but received ${typeof documentBadges}`
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
    `Expected \`document.actions\` to be an array or a function, but received ${typeof documentActions}`
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
      `Expected \`document.resolveNewDocumentOptions\` to be a function, but received ${typeof resolveNewDocumentOptions}`
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
    `Expected \`form.file.assetSources\` to be an array or a function, but received ${typeof assetSources}`
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
    `Expected \`form.image.assetSources\` to be an array or a function, but received ${typeof assetSources}`
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
    `Expected \`document.unstable_languageFilter\` to be an array or a function, but received ${typeof resolveDocumentLanguageFilter}`
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
    `Expected \`document.inspectors\` to be an array or a function, but received ${typeof resolveInspectorsFilter}`
  )
}
