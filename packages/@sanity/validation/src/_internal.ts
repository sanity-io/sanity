// oxlint-disable-next-line import/no-unassigned-import -- side effect: keeps ValidationContext module augmentations on the internal type surface
import './types'

export {getFallbackLocaleSource} from './i18n/fallback'
export {validationLocaleStrings} from './i18n/resources'
export type {LocaleSource} from './i18n/types'
export {inferFromSchema} from './inferFromSchema'
export {hasValidationContext, inferFromSchemaType} from './inferFromSchemaType'
export {Rule} from './Rule'
export type {ValidationContext} from './types'
export {convertToValidationMarker} from './util/convertToValidationMarker'
export {getTypeChain, normalizeValidationRules} from './util/normalizeValidationRules'
export {pathToString} from './util/pathToString'
export {typeString} from './util/typeString'
export {
  evaluateDocumentInternal,
  evaluateDocumentObservable,
  resolveTypeForArrayItem,
  validateDocumentInternal,
  type ValidateDocumentInternalOptions,
  type ValidateItemOptions,
  validateDocumentObservable,
  type ValidateDocumentObservableOptions,
  validateItem,
} from './validateDocument'
