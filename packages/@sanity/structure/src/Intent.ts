import {isObject} from 'lodash'
import {DocumentList, getTypeNamesFromFilter} from './DocumentList'
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
  identity?: symbol
}

const isRecord = isObject as (value: unknown) => value is Record<string, unknown>

const isDocumentList = (value: unknown): value is DocumentList =>
  isRecord(value) && value.type === 'documentList'

/**
 * TODO add comment
 */
export const defaultIntentChecker: IntentChecker = (intentName, params, {pane, index}): boolean => {
  if (!isDocumentList(pane)) return false
  if (intentName !== 'edit' && intentName !== 'create') return false

  const paneFilter = pane.options.filter
  const paneParams = pane.options.params || {}
  const typeNames = pane.schemaTypeName
    ? [pane.schemaTypeName]
    : getTypeNamesFromFilter(paneFilter, paneParams)

  const initialValueTemplates = pane.initialValueTemplates || []

  // if on the root or first level
  if (index <= 1) {
    // if the it's a create intent and there is a template
    if (intentName === 'create' && params.template) {
      // then it can handle the intent if we have a matching template ID
      return initialValueTemplates.some(({templateId}) => templateId === params.template)
    }

    // other we can handle the intent if there is a matching type name
    return typeNames.includes(params.type)
  }

  // if past the root or first level, then we have stricter criteria.
  // it can only handle the intent if the intent type is the schema type name
  // and the pane filter is the default filter
  return pane.schemaTypeName === params.type && paneFilter === '_type == $type'
}

defaultIntentChecker.identity = DEFAULT_INTENT_HANDLER
