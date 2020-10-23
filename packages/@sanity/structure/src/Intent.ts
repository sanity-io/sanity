import {PartialDocumentList, getTypeNamesFromFilter} from './DocumentList'
import {StructureNode} from './StructureNodes'

type JsonParams = {[key: string]: any}

type BaseIntentParams = {
  type?: string
  id?: string
  template?: string
}

export const DEFAULT_INTENT_HANDLER = Symbol('Document type list canHandleIntent')

export type IntentParams = BaseIntentParams | [BaseIntentParams, JsonParams]

export interface Intent {
  type: string
  params?: IntentParams
}

export interface IntentChecker {
  (
    intentName: string,
    params: {[key: string]: any},
    context: {pane: StructureNode; index: number}
  ): boolean
  identity?: Symbol
}

export const defaultIntentChecker: IntentChecker = (intentName, params, {pane}): boolean => {
  const isEdit = intentName === 'edit'
  const isCreate = intentName === 'create'
  const typedSpec = pane as PartialDocumentList
  const paneFilter = (typedSpec.options && typedSpec.options.filter) || ''
  const paneParams = (typedSpec.options && typedSpec.options.params) || {}
  const typeNames = typedSpec.schemaTypeName
    ? [typedSpec.schemaTypeName]
    : getTypeNamesFromFilter(paneFilter, paneParams)

  const initialValueTemplates = typedSpec.initialValueTemplates || []

  if (isCreate && params.template) {
    return initialValueTemplates.some((tpl) => tpl.templateId === params.template)
  }

  return (
    (isEdit && params.id && typeNames.includes(params.type)) ||
    (isCreate && typeNames.includes(params.type))
  )
}

defaultIntentChecker.identity = DEFAULT_INTENT_HANDLER
