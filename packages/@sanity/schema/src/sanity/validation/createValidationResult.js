// @flow
import type {Severity, ValidationResult} from '../typedefs'

// Temporary solution to ensure we have a central registry over used helpIds
export const HELP_IDS = {
  TYPE_NAME_RESERVED: 'schema-type-name-reserved',
  TYPE_MISSING_NAME: 'schema-type-missing-name-or-type',
  TYPE_MISSING_TYPE: 'schema-type-missing-name-or-type',
  TYPE_TITLE_RECOMMENDED: 'schema-type-title-is-recommended',
  TYPE_TITLE_INVALID: 'schema-type-title-is-recommended',
  OBJECT_FIELDS_INVALID: 'schema-object-fields-invalid',
  OBJECT_FIELD_NOT_UNIQUE: 'schema-object-fields-invalid',
  OBJECT_FIELD_NAME_INVALID: 'schema-object-fields-invalid',
  ARRAY_OF_INVALID: 'schema-array-of-invalid',
  ARRAY_OF_NOT_UNIQUE: 'schema-array-of-invalid',
  REFERENCE_TO_INVALID: 'schema-reference-to-invalid',
  REFERENCE_TO_NOT_UNIQUE: 'schema-reference-to-invalid',
  SLUG_SLUGIFY_FN_RENAMED: 'slug-slugifyfn-renamed',
  ASSET_METADATA_FIELD_INVALID: 'asset-metadata-field-invalid'
}

function createValidationResult(
  severity: Severity,
  message: string,
  helpId: ?string
): ValidationResult {
  if (helpId && !Object.keys(HELP_IDS).some(id => HELP_IDS[id] === helpId)) {
    throw new Error(
      `Used the unknown helpId "${helpId}", please add it to the array in createValidationResult.js`
    )
  }
  return {
    severity,
    message,
    helpId
  }
}

export const error = (message: string, helpId: ?string, path: ?(string[])) =>
  createValidationResult('error', message, helpId)

export const warning = (message: string, helpId: ?string, path: ?(string[])) =>
  createValidationResult('warning', message, helpId)

export const info = (message: string, helpId: ?string, path: ?(string[])) =>
  createValidationResult('info', message, helpId)
