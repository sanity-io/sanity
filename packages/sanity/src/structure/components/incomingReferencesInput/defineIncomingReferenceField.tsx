import {defineField, type StringDefinition} from '@sanity/types'

import {IncomingReferencesInput} from './IncomingReferencesInput'
import {type IncomingReferencesOptions} from './types'

/**
 * Helper function to define an incoming references field.
 * It will add the IncomingReferencesInput component to the field.
 *
 * example:
 * ```ts
 * defineType({
 *   name: 'author',
 *   type: 'document',
 *   fields: [
 *      defineField({
 *        name: 'name',
 *        type: 'string',
 *        title: 'Name',
 *      }),
 *      defineIncomingReferenceField({
 *      name: 'incomingReferences',
 *      title: 'Incoming references',
 *      options: {
 *        types: [{type: 'author'}],
 *      },
 *    })
 *   ]
 * })
 * ```
 *
 * @beta
 */
export function defineIncomingReferenceField(fieldOptions: {
  name: string
  title?: string
  description?: StringDefinition['description']
  hidden?: StringDefinition['hidden']
  options: IncomingReferencesOptions
}) {
  const {name, title, hidden, description, options} = fieldOptions
  return defineField({
    name,
    title,
    hidden,
    description,
    /**
     * For now the type is fixed to a string.
     * This will change once the form decorator type is implemented.
     * See https://github.com/sanity-io/sanity/pull/10789 for more details.
     *
     */
    type: 'string',
    options: {
      canvasApp: {exclude: true},
      sanityCreate: {exclude: true},
    },
    components: {
      input: (props) => <IncomingReferencesInput {...props} {...options} />,
    },
  })
}
