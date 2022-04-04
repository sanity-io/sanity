import {Template, TemplateResponse} from '../templates'
import {
  DocumentActionComponent,
  DeleteAction,
  DiscardChangesAction,
  DuplicateAction,
  PublishAction,
  UnpublishAction,
  DocumentBadgeComponent,
  LiveEditBadge,
} from '../deskTool'
import {
  ConfigContext,
  ConfigPropertyReducer,
  AsyncConfigPropertyReducer,
  ResolveProductionUrlContext,
  SanityTool,
  DocumentActionsContext,
  DocumentBadgesContext,
  NewDocumentOptionsContext,
} from './types'

export const initialDocumentBadges = [LiveEditBadge]

export const initialDocumentActions = [
  PublishAction,
  DiscardChangesAction,
  UnpublishAction,
  DuplicateAction,
  DeleteAction,
]

export const schemaTypesReducer: ConfigPropertyReducer<
  unknown[],
  Omit<ConfigContext, 'schema' | 'currentUser'>
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
  const resolveProductionUrl = document?.resolveProductionUrl
  // the redundant await is useful for error logging because the error is caught
  // in this stack vs somewhere down stream
  // eslint-disable-next-line no-return-await
  if (resolveProductionUrl) return await resolveProductionUrl(prev, context)
  return prev
}

export const toolsReducer: ConfigPropertyReducer<SanityTool[], ConfigContext> = (
  prev,
  {tools},
  context
) => {
  if (!tools) return prev
  if (typeof tools === 'function') return tools(prev, context)
  if (Array.isArray(tools)) return [...prev, ...tools]

  throw new Error(`Expected \`tools\` to an array or a function but found ${typeof tools} instead.`)
}

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
  const resolveNewDocumentOptions = document?.resolveNewDocumentOptions
  if (!resolveNewDocumentOptions) return prev

  if (typeof resolveNewDocumentOptions !== 'function') {
    throw new Error(
      `Expected \`document.resolveNewDocumentOptions\` a function but found ${typeof resolveNewDocumentOptions} instead.`
    )
  }

  return resolveNewDocumentOptions(prev, context)
}
