import {type BaseIntentParams, type Intent, type IntentJsonParams, type IntentParams} from 'sanity'

import {type PartialDocumentList} from './DocumentList'
import {type StructureNode} from './StructureNodes'
import {getTypeNamesFromFilter} from './util/getTypeNamesFromFilter'

export {type BaseIntentParams, type Intent, type IntentJsonParams, type IntentParams}

/** @internal */
export const DEFAULT_INTENT_HANDLER = Symbol('Document type list canHandleIntent')

/**
 * Interface for intent checker
 *
 * @public
 */
export interface IntentChecker {
  (
    /** Intent name */
    intentName: string,
    /** Intent checker parameter */
    params: {[key: string]: any},
    /** Structure context. See {@link StructureNode} */
    context: {pane: StructureNode; index: number},
  ): boolean
  /** intent checker identify */
  identity?: symbol
}

/** @internal */
export const defaultIntentChecker: IntentChecker = (intentName, params, {pane}): boolean => {
  const isEdit = intentName === 'edit'
  const isCreate = intentName === 'create'
  const typedSpec = pane as PartialDocumentList
  const paneFilter = typedSpec.options?.filter || ''
  const paneParams = typedSpec.options?.params || {}
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
