// @flow
import type {Severity, ValidationResult} from '../typedefs'

// Temporary solution to ensure we have a central registry over used helpIds
export const HELP_IDS = {
  TYPE_NAME_NOT_UNIQUE: 'schema-type-name-not-unique',
  TYPE_NAME_RESERVED: 'schema-type-name-reserved',
  TYPE_MISSING_NAME: 'schema-type-missing-name',
  TYPE_MISSING_TYPE: 'schema-type-missing-type',
  TYPE_UNKNOWN_TYPE: 'schema-type-unknown-type',
  TYPE_TITLE_RECOMMENDED: 'schema-type-title-is-recommended',
  TYPE_TITLE_INVALID: 'schema-type-title-invalid',
  OBJECT_FIELDS_INVALID: 'schema-object-fields-invalid',
  OBJECT_FIELD_NOT_UNIQUE: 'schema-object-field-not-unique',
  OBJECT_FIELD_NAME_INVALID: 'schema-object-type-field-name-invalid',
  ARRAY_OF_INVALID: 'schema-array-of-invalid',
  ARRAY_OF_NOT_UNIQUE: 'schema-array-of-not-unique',
  REFERENCE_TO_INVALID: 'schema-reference-to-invalid',
  REFERENCE_TO_NOT_UNIQUE: 'schema-reference-to-not-unique'
}

function createValidationResult(
  severity: Severity,
  message: string,
  helpId: ?string
): ValidationResult {
  if (helpId && !Object.keys(HELP_IDS).some(id => (HELP_IDS[id] === helpId))) {
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
