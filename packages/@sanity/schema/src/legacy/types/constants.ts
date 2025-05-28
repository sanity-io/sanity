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
