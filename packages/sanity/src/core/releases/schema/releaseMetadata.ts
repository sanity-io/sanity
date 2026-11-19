import {
  type ConditionalPropertyCallbackContext,
  defineField,
  type FieldDefinition,
  type ObjectDefinition,
  type SchemaValidationValue,
} from '@sanity/types'

import {warnReleaseMetadata} from '../../config/releases/metadataFields'
import {type ReleaseMetadataConfig} from '../../config/types'
import {isRecord} from '../../util/isRecord'

/** @internal */
export const RELEASE_METADATA_TYPE_NAME = 'sanity.releaseMetadata'

/**
 * The fields the release create and edit actions, and the releases tool, read. They come first
 * in `sanity.releaseMetadata`, and a configured field can't replace them.
 *
 * @internal
 */
export const RELEASE_METADATA_CORE_FIELDS: FieldDefinition[] = [
  defineField({
    name: 'title',
    title: 'Title',
    type: 'string',
  }),
  defineField({
    name: 'description',
    title: 'Description',
    type: 'text',
  }),
  defineField({
    name: 'releaseType',
    title: 'Release type',
    type: 'string',
    initialValue: 'undecided',
    options: {
      list: [
        {title: 'ASAP', value: 'asap'},
        {title: 'At time', value: 'scheduled'},
        {title: 'Undecided', value: 'undecided'},
      ],
    },
    validation: (rule) => rule.required(),
  }),
  defineField({
    name: 'intendedPublishAt',
    title: 'Intended publish date',
    type: 'datetime',
    hidden: ({parent}: ConditionalPropertyCallbackContext) =>
      !isRecord(parent) || parent.releaseType !== 'scheduled',
  }),
  defineField({
    name: 'cardinality',
    title: 'Cardinality',
    type: 'string',
    hidden: true,
    options: {
      list: [
        {title: 'Many documents', value: 'many'},
        {title: 'One document', value: 'one'},
      ],
    },
  }),
]

/**
 * Metadata keys a configured field must not write: the create and edit actions replace the
 * whole metadata object, and these keys already have their own controls.
 *
 * @internal
 */
export const RESERVED_RELEASE_METADATA_NAMES: ReadonlySet<string> = new Set(
  RELEASE_METADATA_CORE_FIELDS.map((field) => field.name),
)

/**
 * The `sanity.releaseMetadata` definition. Its `validation` takes anything a field's validation
 * does, like a list with the rules of several configs.
 *
 * @internal
 */
export interface ReleaseMetadataDefinition extends Omit<ObjectDefinition, 'name' | 'validation'> {
  name: typeof RELEASE_METADATA_TYPE_NAME
  validation?: SchemaValidationValue
}

/**
 * The `sanity.releaseMetadata` object type: the core fields, followed by the fields, fieldsets,
 * groups and validation the workspace configures in `releases.metadata`. A configured field named
 * like a core field is dropped with a warning.
 *
 * @internal
 */
export function releaseMetadataSchema(
  config: ReleaseMetadataConfig = {},
): ReleaseMetadataDefinition {
  const {fields = [], ...rest} = config
  return {
    ...rest,
    name: RELEASE_METADATA_TYPE_NAME,
    title: 'Release metadata',
    type: 'object',
    fields: [
      ...RELEASE_METADATA_CORE_FIELDS,
      ...fields.filter((field) => {
        if (!RESERVED_RELEASE_METADATA_NAMES.has(field.name)) return true
        warnReleaseMetadata(
          'fields',
          `Dropped field "${field.name}": name "${field.name}" is reserved`,
        )
        return false
      }),
    ],
  }
}
