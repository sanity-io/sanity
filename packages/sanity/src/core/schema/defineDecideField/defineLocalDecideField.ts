import {defineField} from '@sanity/types'

import {AudienceSelectInput} from '../../form/inputs/AudienceSelectInput'

/**
 * Helper function for defining a "decide field" - a field that can have different values
 * based on audience conditions. This creates an object type with a default value and
 * conditional audience-specific values.
 *
 * The decide field structure includes:
 * - `default`: The default value used when no conditions match
 * - `conditions`: Array of audience-specific conditions with their values
 *
 * @param config - Field configuration object with name, title, type, and other field options
 *
 * @example
 * ```ts
 * defineLocalDecideField({
 *   name: 'decideName',
 *   title: '[Decide] Name',
 *   type: 'string',
 *   validation: (rule) => rule.required(),
 * })
 * ```
 *
 * @beta
 */
export function defineLocalDecideField(config: any) {
  const {name, title, description, type, ...otherConfig} = config

  const valueFieldConfig = {
    type,
    ...otherConfig,
  }

  return defineField({
    name,
    title,
    description,
    type: 'object',
    fields: [
      defineField({
        name: 'default',
        title: 'Default Value',
        ...valueFieldConfig,
      } as any),
      defineField({
        name: 'conditions',
        title: 'Conditions',
        type: 'array',
        of: [
          defineField({
            type: 'object',
            name: 'condition',
            title: 'Condition',
            fields: [
              defineField({
                name: 'audience',
                title: 'Audience Equality',
                validation: (Rule: any) => Rule.required(),
                type: 'string',
                components: {
                  input: AudienceSelectInput,
                },
              } as any),
              defineField({
                name: 'value',
                title: 'Value',
                ...valueFieldConfig,
              } as any),
            ],
          } as any),
        ],
      } as any),
    ],
  } as any)
}
