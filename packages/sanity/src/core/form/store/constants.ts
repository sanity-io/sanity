import {ALL_FIELDS_GROUP_NAME} from '@sanity/schema/_internal'
import {type FieldGroup} from '@sanity/types'

import {studioLocaleNamespace} from '../../i18n/localeNamespaces'

/**
 * Max supported field depth. Fields deeper than this will be considered hidden.
 */
export const MAX_FIELD_DEPTH = 20

/**
 * Start auto-collapsing fields at this nesting level unless schema/field configuration says otherwise
 */
export const AUTO_COLLAPSE_DEPTH = 3

/**
 * The "all fields" group definition
 * Users can import this to create a custom "all fields" group.
 * Name must be `all-fields` to be considered an "all fields" group.
 *
 * @example hides the all fields group.
 * ```ts
 *
 * const author = defineType({
 *   name: 'author',
 *   title: 'Author',
 *   type: 'document',
 *   groups: [
 *     {
 *       ...ALL_FIELDS_GROUP,
 *       hidden: true,
 *     },
 *   ],
 * })
 * ```
 *
 * @public
 */
export const ALL_FIELDS_GROUP: FieldGroup = {
  name: ALL_FIELDS_GROUP_NAME,
  title: 'All fields',
  hidden: false,
  i18n: {
    title: {
      key: 'inputs.object.field-group-tabs.all-fields-title',
      ns: studioLocaleNamespace,
    },
  },
}
