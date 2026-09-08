import {type ValidationMarker as BaseValidationMarker} from '@sanity/types'

/** Machine-readable codes emitted by built-in document validation. @beta */
export const validationMarkerCodes = {
  arrayDuplicateItem: 'array.duplicate-item',
  arrayExactLength: 'array.exact-length',
  arrayMaximumLength: 'array.maximum-length',
  arrayMinimumLength: 'array.minimum-length',
  assetRequired: 'asset.required',
  custom: 'custom',
  dateInvalidFormat: 'date.invalid-format',
  dateMaximum: 'date.maximum',
  dateMinimum: 'date.minimum',
  documentUnknownType: 'document.unknown-type',
  mediaCustom: 'media.custom',
  mediaInvalidReference: 'media.invalid-reference',
  mediaNotFound: 'media.not-found',
  numberGreaterThan: 'number.greater-than',
  numberInteger: 'number.integer',
  numberLessThan: 'number.less-than',
  numberMaximum: 'number.maximum',
  numberMinimum: 'number.minimum',
  numberPrecision: 'number.precision',
  objectUnknownField: 'object.unknown-field',
  referenceInvalid: 'reference.invalid',
  referenceNotPublished: 'reference.not-published',
  ruleAllFailed: 'rule.all-failed',
  ruleEitherFailed: 'rule.either-failed',
  slugInvalidType: 'slug.invalid-type',
  slugMissingCurrent: 'slug.missing-current',
  slugNotUnique: 'slug.not-unique',
  stringEmail: 'string.email',
  stringExactLength: 'string.exact-length',
  stringLowercase: 'string.lowercase',
  stringMaximumLength: 'string.maximum-length',
  stringMinimumLength: 'string.minimum-length',
  stringRegexMatch: 'string.regex-match',
  stringRegexMismatch: 'string.regex-mismatch',
  stringUppercase: 'string.uppercase',
  stringUrlCredentialsNotAllowed: 'string.url.credentials-not-allowed',
  stringUrlInvalid: 'string.url.invalid',
  stringUrlNotAbsolute: 'string.url.not-absolute',
  stringUrlNotRelative: 'string.url.not-relative',
  stringUrlSchemeNotAllowed: 'string.url.scheme-not-allowed',
  validationException: 'validation.exception',
  validationFailed: 'validation.failed',
  valueNotAllowed: 'value.not-allowed',
  valueRequired: 'value.required',
  valueTypeMismatch: 'value.type-mismatch',
} as const

/** A code emitted by a built-in validator. @beta */
export type BuiltInValidationMarkerCode =
  (typeof validationMarkerCodes)[keyof typeof validationMarkerCodes]

/**
 * A built-in validation code or an application-defined custom code.
 * Custom validators should namespace their codes, for example `custom.seo-title`.
 * @beta
 */
export type ValidationMarkerCode = BuiltInValidationMarkerCode | (string & {})

/** A validation marker emitted by `validateDocument`, which always has a code. @beta */
export type DocumentValidationMarker = Omit<BaseValidationMarker, 'code'> & {
  code: ValidationMarkerCode
}
