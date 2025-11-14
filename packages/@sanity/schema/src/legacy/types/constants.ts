export const DEFAULT_OVERRIDEABLE_FIELDS = [
  'jsonType',
  'type',
  'name',
  'title',
  'description',
  'options',
  'fieldsets',
  'validation',
  'readOnly',
  'hidden',
  'components',
  'diffComponent',
  'initialValue',
  'deprecated',
]

/**
 * The property name used for each type where we store the "own props" of the type.
 * This is the set of properties which are _not_ inherited, but explicitly defined on this type.
 */
export const OWN_PROPS_NAME = '_internal_ownProps'

export const ALL_FIELDS_GROUP_NAME = 'all-fields'

/**
 * Name for configuring a decorator field type
 * this fields are rendered in the form but are not extracted by the schema extractor.
 * They serve only for UI purposes.
 * @beta
 */
export const INTERNAL_FORM_DECORATOR = 'sanity.internalFormDecorator' as const
