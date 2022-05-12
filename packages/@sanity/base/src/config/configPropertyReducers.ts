import {isValidElementType} from 'react-is'
import {Schema, AssetSource} from '@sanity/types'
import type {Template, TemplateResponse} from '../templates'
import {
  DocumentActionComponent,
  DeleteAction,
  DiscardChangesAction,
  DuplicateAction,
  PublishAction,
  UnpublishAction,
} from '../desk/actions'
import {DocumentBadgeComponent, LiveEditBadge} from '../desk/badges'
import {InputProps, FieldProps, ItemProps} from '../form'
import {isRecord} from '../util'
import {PreviewProps} from '../components/previews'
import type {
  ConfigContext,
  ConfigPropertyReducer,
  AsyncConfigPropertyReducer,
  ResolveProductionUrlContext,
  Tool,
  DocumentActionsContext,
  DocumentBadgesContext,
  NewDocumentOptionsContext,
  FormBuilderComponentResolverContext,
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
  Schema.TypeDefinition[],
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

export const inputComponentResolver: ConfigPropertyReducer<
  React.ComponentType<InputProps>,
  FormBuilderComponentResolverContext
> = (prev, {formBuilder}, context) => {
  const schemaTypeName = context.schemaType.name
  const components = formBuilder?.components?.[schemaTypeName]

  // eslint-disable-next-line no-nested-ternary
  const component = isValidElementType(components)
    ? (components as React.ComponentType<InputProps>)
    : // TODO: this should be validated to be an input component
    isRecord(components) && components.input
    ? components.input
    : prev

  const resolver = formBuilder?.resolve?.input
  return resolver ? resolver(component, context) : component
}

export const fieldComponentResolver: ConfigPropertyReducer<
  React.ComponentType<FieldProps>,
  FormBuilderComponentResolverContext
> = (prev, {formBuilder}, context) => {
  const schemaTypeName = context.schemaType.name

  const components = formBuilder?.components?.[schemaTypeName]
  const component = isRecord(components) && components.field ? components.field : prev

  const resolver = formBuilder?.resolve?.field
  return resolver ? resolver(component, context) : component
}

export const itemComponentResolver: ConfigPropertyReducer<
  React.ComponentType<ItemProps>,
  FormBuilderComponentResolverContext
> = (prev, {formBuilder}, context) => {
  const schemaTypeName = context.schemaType.name

  const components = formBuilder?.components?.[schemaTypeName]
  const component = isRecord(components) && components.item ? components.item : prev

  const resolver = formBuilder?.resolve?.item
  return resolver ? resolver(component, context) : component
}

export const previewComponentResolver: ConfigPropertyReducer<
  React.ComponentType<PreviewProps>,
  FormBuilderComponentResolverContext
> = (prev, {formBuilder}, context) => {
  const schemaTypeName = context.schemaType.name

  const components = formBuilder?.components?.[schemaTypeName]
  const component = isRecord(components) && components.preview ? components.preview : prev

  const resolver = formBuilder?.resolve?.preview
  return resolver ? resolver(component, context) : component
}

export const fileAssetSourceResolver: ConfigPropertyReducer<AssetSource[], ConfigContext> = (
  prev,
  {formBuilder},
  context
) => {
  const assetSources = formBuilder?.file?.assetSources
  if (!assetSources) return prev

  if (typeof assetSources === 'function') return assetSources(prev, context)
  if (Array.isArray(assetSources)) return [...prev, ...assetSources]

  throw new Error(
    `Expected \`file.assetSources\` to an array or a function but found ${typeof assetSources} instead.`
  )
}

export const imageAssetSourceResolver: ConfigPropertyReducer<AssetSource[], ConfigContext> = (
  prev,
  {formBuilder},
  context
) => {
  const assetSources = formBuilder?.image?.assetSources
  if (!assetSources) return prev

  if (typeof assetSources === 'function') return assetSources(prev, context)
  if (Array.isArray(assetSources)) return [...prev, ...assetSources]

  throw new Error(
    `Expected \`image.assetSources\` to an array or a function but found ${typeof assetSources} instead.`
  )
}
