import {PartialDocumentList, getTypeNamesFromFilter} from './DocumentList'
import {StructureNode} from './StructureNodes'

/**
 * Intent parameters (json)
 *
 * @public
 */
export type IntentJsonParams = {[key: string]: any}

/**
 * Interface for base intent parameters
 *
 * @public */
export interface BaseIntentParams {
  /* Intent type */
  type?: string
  /* Intent Id */
  id?: string
  /* Intent template */
  template?: string
  /**
   * Experimental field path
   * @beta
   * @experimental
   * @hidden
   */
  path?: string
}

/** @internal */
export const DEFAULT_INTENT_HANDLER = Symbol('Document type list canHandleIntent')

/**
 * Intent parameters
 * See {@link BaseIntentParams} and {@link IntentJsonParams}
 *
 * @public
 */
export type IntentParams = BaseIntentParams | [BaseIntentParams, IntentJsonParams]

/**
 * Interface for intents
 * @public */
// TODO: intents should be unified somewhere
export interface Intent {
  /** Intent type */
  type: string
  /** Intent parameters. See {@link IntentParams}
   */
  params?: IntentParams
}

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
    context: {pane: StructureNode; index: number}
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
