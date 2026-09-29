import {defineArrayMember, defineField, defineType, type ValidationError} from 'sanity'

function validateDestination(destination: string | undefined): true | ValidationError {
  if (!destination || destination === '/' || !destination.endsWith('/')) {
    return true
  }

  return {
    message: 'Destination must not end with a trailing slash',
    suggestedFixes: [
      {type: 'set', title: 'Remove trailing slash', value: destination.replace(/\/+$/, '')},
    ],
  }
}

const redirect = defineType({
  name: 'validationSuggestedFixesRedirect',
  title: 'Redirect',
  type: 'object',
  fields: [
    defineField({name: 'source', title: 'Source', type: 'string'}),
    defineField({
      name: 'destination',
      title: 'Destination',
      type: 'string',
      validation: (rule) => rule.custom(validateDestination),
    }),
  ],
})

export const validationSuggestedFixesTypes = [
  redirect,
  defineType({
    name: 'validationSuggestedFixes',
    title: 'Validation suggested fixes',
    type: 'document',
    fields: [
      defineField({
        name: 'destination',
        title: 'Destination',
        description: 'Type a path ending in a slash, e.g. /about/',
        type: 'string',
        validation: (rule) => rule.custom(validateDestination),
      }),
      defineField({
        name: 'slug',
        title: 'Legacy slug',
        description: 'Deprecated: any value here suggests clearing it',
        type: 'string',
        validation: (rule) =>
          rule.custom((value) =>
            value
              ? {
                  message: 'This field is deprecated and should be empty',
                  suggestedFixes: [{type: 'unset', title: 'Clear value'}],
                }
              : true,
          ),
      }),
      defineField({
        name: 'redirects',
        title: 'Redirects',
        type: 'array',
        of: [defineArrayMember({type: redirect.name})],
      }),
    ],
  }),
]
