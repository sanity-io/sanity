import {defineLocalesResources} from '../helpers'
import {copyPasteLocalNamespace} from '../localeNamespaces'
import {type LocaleResourceBundle} from '../types'

/**
 * The string resources for copy-paste.
 *
 * @internal
 * @hidden
 */
const copyPasteLocaleStrings = defineLocalesResources('copy-paste', {
  /** Text on the field action button to copy a document */
  'copy-paste.field-action-copy-button.document.title': 'Copy document',
  /** Text on the field action button to copy a field */
  'copy-paste.field-action-copy-button.field.title': 'Copy field',
  /** Text on the field action button to paste a document */
  'copy-paste.field-action-paste-button.document.title': 'Paste document',
  /** Text on the field action button to paste a field */
  'copy-paste.field-action-paste-button.field.title': 'Paste field',

  /** --- On paste --- */

  /** The validation message that is shown when pasting a value into a read-only target */
  'copy-paste.on-paste.validation.read-only-target.description': 'The target is read-only',
  /** The validation message that is shown when the source and target schema types are incompatible */
  'copy-paste.on-paste.validation.schema-type-incompatible.description':
    'Source and target schema types are not compatible',
  /** The validation message that is shown when reference types are incompatible */
  'copy-paste.on-paste.validation.reference-type-incompatible.description':
    'References of type "{{targetReferenceTypes}}" is not allowed in reference field to types "{{sourceReferenceTypes}}"',
  /** The validation message that is shown when image files are incompatible */
  'copy-paste.on-paste.validation.image-file-incompatible.description':
    'A "{{sourceSchemaType}}" is not allowed in a "{{targetSchemaType}}"',
  /** The validation message that is shown when array types are incompatible */
  'copy-paste.on-paste.validation.array-type-incompatible.description':
    'Value of type "{{type}}" is not allowed in this array field',
  /** The validation message that is shown when array values are incompatible */
  'copy-paste.on-paste.validation.array-value-incompatible.description':
    'Value of type "{{type}}" is not allowed in this array field',
  /** The validation message that is shown when string values are incompatible */
  'copy-paste.on-paste.validation.string-value-incompatible.description':
    'Value "{{value}}" is not allowed in "{{allowedStrings}}"',
  /** The validation message that is shown when primitive types are incompatible */
  'copy-paste.on-paste.validation.primitive-type-incompatible.description':
    'Value of type "{{type}}" is not allowed in this field',

  /** The validation message that is shown when the clipboard is empty */
  'copy-paste.on-paste.validation.clipboard-empty.title': 'Nothing to paste',
  /** The validation message that is shown when the clipboard item is invalid */
  'copy-paste.on-paste.validation.clipboard-invalid.title': 'Invalid clipboard item',
  /** The validation message that is shown when schema types are incompatible */
  'copy-paste.on-paste.validation.schema-type-incompatible.title':
    'Could not resolve schema type for path: {{path}}',
  /** The warning message that is shown when not all values can be pasted */
  'copy-paste.on-paste.validation.partial-warning.title': 'Could not paste all values',
  /** The success message that is shown when a document is pasted */
  'copy-paste.on-paste.validation.document-paste-success.title':
    'Document "{{fieldNames}}" updated',
  /** The success message that is shown when a field is pasted */
  'copy-paste.on-paste.validation.field_one-paste-success.title': 'Field "{{fieldName}}" updated',

  /** --- On copy --- */

  /** The error message that is shown when there is an unknown error looking up document metadata */
  'copy-paste.on-copy.validation.document-metadata-unknown-error.title':
    "Can't lookup the document meta data due to unknown error",
  /** The error message that is shown when there is an unknown error */
  'copy-paste.on-copy.validation.unknown-error.title':
    "Can't lookup the document meta data due to unknown error",
  /** The error message that is shown when schema types are incompatible */
  'copy-paste.on-copy.validation.schema-type-incompatible.title':
    'Could not resolve schema type for path: {{path}}',
  /** The error message that is shown when there is no value to copy */
  'copy-paste.on-copy.validation.no-value.title': 'Empty value, nothing to copy',
  /** The error message that is shown when the clipboard is not supported */
  'copy-paste.on-copy.validation.clipboard-not-supported.title':
    'Your browser does not support this action (yet)',
  /** The success message that is shown when a document is copied */
  'copy-paste.on-copy.validation.copy-document-success.title': 'Document "{{fieldNames}}" copied',
  /** The success message that is shown when a field is copied */
  'copy-paste.on-copy.validation.copy-field_one-success.title': 'Field "{{fieldName}}" copied',
})

/**
 * Locale resources for the copy/paste namespace, eg US English locale resources.
 *
 * @beta
 * @hidden
 */
export const copyPasteLocaleResources: LocaleResourceBundle = {
  locale: 'en-US',
  namespace: copyPasteLocalNamespace,
  resources: copyPasteLocaleStrings,
}
