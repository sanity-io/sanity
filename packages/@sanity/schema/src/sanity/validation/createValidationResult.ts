import type {SchemaValidationResult} from '../typedefs'

// Temporary solution to ensure we have a central registry over used helpIds
export const HELP_IDS = {
  TYPE_INVALID: 'schema-type-invalid',
  TYPE_IS_ESM_MODULE: 'schema-type-is-esm-module',
  TYPE_NAME_RESERVED: 'schema-type-name-reserved',
  TYPE_MISSING_NAME: 'schema-type-missing-name-or-type',
  TYPE_MISSING_TYPE: 'schema-type-missing-name-or-type',
  TYPE_TITLE_RECOMMENDED: 'schema-type-title-is-recommended',
  TYPE_TITLE_INVALID: 'schema-type-title-is-recommended',
  OBJECT_FIELDS_INVALID: 'schema-object-fields-invalid',
  OBJECT_FIELD_NOT_UNIQUE: 'schema-object-fields-invalid',
  OBJECT_FIELD_NAME_INVALID: 'schema-object-fields-invalid',
  OBJECT_FIELD_DEFINITION_INVALID_TYPE: 'schema-object-fields-invalid',
  ARRAY_PREDEFINED_CHOICES_INVALID: 'schema-predefined-choices-invalid',
  ARRAY_OF_ARRAY: 'schema-array-of-array',
  ARRAY_OF_INVALID: 'schema-array-of-invalid',
  ARRAY_OF_NOT_UNIQUE: 'schema-array-of-invalid',
  ARRAY_OF_TYPE_GLOBAL_TYPE_CONFLICT: 'schema-array-of-type-global-type-conflict',
  ARRAY_OF_TYPE_BUILTIN_TYPE_CONFLICT: 'schema-array-of-type-builtin-type-conflict',
  REFERENCE_TO_INVALID: 'schema-reference-to-invalid',
  REFERENCE_TO_NOT_UNIQUE: 'schema-reference-to-invalid',
  REFERENCE_INVALID_OPTIONS: 'schema-reference-invalid-options',
  REFERENCE_INVALID_OPTIONS_LOCATION: 'schema-reference-options-nesting',
  REFERENCE_INVALID_FILTER_PARAMS_COMBINATION: 'schema-reference-filter-params-combination',
  SLUG_SLUGIFY_FN_RENAMED: 'slug-slugifyfn-renamed',
  ASSET_METADATA_FIELD_INVALID: 'asset-metadata-field-invalid',
  CROSS_DATASET_REFERENCE_INVALID: 'cross-dataset-reference-invalid',
  DEPRECATED_BLOCKEDITOR_KEY: 'schema-deprecated-blockeditor-key',
  STANDALONE_BLOCK_TYPE: 'schema-standalone-block-type',
}

function createValidationResult(
  severity: SchemaValidationResult['severity'],
  message: string,
  helpId: string | null
): SchemaValidationResult {
  if (helpId && !Object.keys(HELP_IDS).some((id) => HELP_IDS[id] === helpId)) {
    throw new Error(
      `Used the unknown helpId "${helpId}", please add it to the array in createValidationResult.js`
    )
  }
  return {
    severity,
    message,
    helpId,
  }
}

export const error = (message: string, helpId?: string | null): SchemaValidationResult =>
  createValidationResult('error', message, helpId)

export const warning = (message: string, helpId?: string | null): SchemaValidationResult =>
  createValidationResult('warning', message, helpId)

export const info = (message: string, helpId?: string | null): SchemaValidationResult =>
  createValidationResult('info', message, helpId)
