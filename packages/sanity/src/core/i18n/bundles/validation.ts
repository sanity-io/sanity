import {defineLocaleResourceBundle} from '../helpers'
import {validationLocaleNamespace} from '../localeNamespaces'

/**
 * The string resources for validation.
 *
 * @internal
 */
const validationLocaleStrings = {
  /** A value of incorrect type is found, eg found `number` instead of `string` */
  'generic.incorrect-type': 'Expected type "{{expectedType}}", got "{{actualType}}"',

  /** A value is expected, but none is provided */
  'generic.required': 'Required',

  /** Value is not one of the values specifically allowed */
  'generic.not-allowed': 'Value did not match any allowed values',

  /** Value "$givenValue" is not one of the values specifically allowed */
  'generic.not-allowed_hint': 'Value "{{hint}}" did not match any allowed values',

  /** Array has less than the minimum of "$minLength" items */
  'array.minimum-length': 'Must have at least {{minLength}} items',

  /** Portable Text array has less than the minimum of "$minLength" blocks */
  'array.minimum-length_blocks': 'Must have at least {{minLength}} blocks',

  /** Array has more than the maximum of "$maxLength" items */
  'array.maximum-length': 'Must have at most {{maxLength}} items',

  /** Portable Text array has more than the maximum of "$maxLength" items */
  'array.maximum-length_blocks': 'Must have at most {{maxLength}} blocks',

  /** Array must have exactly "$wantedLength" items, but has more/less */
  'array.exact-length': 'Must have exactly {{wantedLength}} items',

  /** Portable Text array must have exactly "$wantedLength" blocks, but has more/less */
  'array.exact-length_blocks': 'Must have exactly {{wantedLength}} blocks',

  /** Array item is a duplicate, but array wants only unique items */
  'array.item-duplicate': `Can't be a duplicate`,

  /** Date is not valid or not in the correct format (ISO-8601) */
  'date.invalid-format': 'Must be a valid ISO-8601 formatted date string',

  /** Date is earlier than the given minimum date "$minDate" */
  'date.minimum': `Must be at or after {{minDate}}`,

  /** Date is later than the given maximum date "$maxDate" */
  'date.maximum': `Must be at or before {{maxDate}}`,

  /** Number is not an integer ("whole number") */
  'number.non-integer': 'Must be an integer',

  /** Number has more precision (decimals) than the allowed "$limit" */
  'number.maximum-precision': 'Max precision is {{limit}}',

  /** Number is lower than the given minimum value "$minNumber" */
  'number.minimum': 'Must be greater than or equal to {{minNumber}}',

  /** Number is higher than the given maximum value "$maxNumber" */
  'number.maximum': 'Must be lower than or equal to {{maxNumber}}',

  /** Number is less than the given minimum threshold value "$threshold" */
  'number.greater-than': 'Must be greater than {{threshold}}',

  /** Number is greater than the given maximum threshold value "$threshold" */
  'number.less-than': 'Must be less than {{threshold}}',

  /** Object is not a reference to a document (eg `{_ref: 'documentId'}`) */
  'object.not-reference': 'Must be a reference to a document',

  /** Object references a document which is not published */
  'object.reference-not-published': 'Referenced document must be published',

  /** Object is missing a reference to an asset document in its `asset` field */
  'object.asset-required': 'Asset is required',

  /** Object is missing a reference to an image asset document in its `asset` field */
  'object.asset-required_image': 'Image is required',

  /** Object is missing a reference to a file asset document in its `asset` field */
  'object.asset-required_file': 'File is required',

  /** Slug is not an object (eg `{current: 'some-slug'}`) */
  'slug.not-object': 'Slug must be an object',

  /** Slug is an object, but is missing a `current` string property */
  'slug.missing-current': 'Slug must have a value',

  /** Slug is already in use somewhere else, but needs to be unique */
  'slug.not-unique': 'Slug is already in use',

  /** String is shorter than the limit of "$minLength" characters */
  'string.minimum-length': 'Must be at least {{minLength}} characters long',

  /** String is longer than the limit of "$maxLength" characters */
  'string.maximum-length': 'Must be at most {{maxLength}} characters long',

  /** String has a different character length than the exact number "$wantedLength" */
  'string.exact-length': 'Must be exactly {{wantedLength}} characters long',

  /** String contains characters that are not in uppercase */
  'string.uppercase': 'Must be all uppercase characters',

  /** String contains characters that are not in lowercase  */
  'string.lowercase': 'Must be all lowercase characters',

  /** String matches the given regular expression, but should not */
  'string.regex-match': 'Should not match "{{name}}"-pattern',

  /** String does not match the given regular expression, but should */
  'string.regex-does-not-match': 'Does not match "{{name}}"-pattern',

  /** String is not a valid email address */
  'string.email': 'Must be a valid email address',

  /** String is not a valid URL */
  'string.url.invalid': 'Not a valid URL',

  /** String is not a relative URL (eg it contains a protocol/host) */
  'string.url.not-relative': 'Only relative URLs are allowed',

  /** String is not an absolute URL (eg it is missing a protocol/host) */
  'string.url.not-absolute': 'Relative URLs are not allowed',

  /** String contains a URL with a username or password specified before the host */
  'string.url.includes-credentials': 'Username/password not allowed',

  /** String contains a protocol/scheme that is not allowed, eg (`ftp`, `mailto`…) */
  'string.url.disallowed-scheme': 'Does not match allowed protocols/schemes',
} as const

/**
 * The i18n resource keys for the validation.
 *
 * @alpha
 * @hidden
 */
export type ValidationLocaleResourceKeys = keyof typeof validationLocaleStrings

/**
 * Locale resources for the validation namespace, eg US English locale resources.
 *
 * @beta
 * @hidden
 */
export const validationLocaleResources = defineLocaleResourceBundle({
  locale: 'en-US',
  namespace: validationLocaleNamespace,
  resources: validationLocaleStrings,
})
