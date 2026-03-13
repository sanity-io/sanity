import {defineField, defineType} from 'sanity'

/**
 * Reproduction schema for https://github.com/sanity-io/sanity/issues/12201
 *
 * Issue: The hidden function on a field is sometimes called without a
 * currentUser, causing an inconsistent state between the form UI and
 * validation context.
 *
 * When hidden depends on currentUser, validation was resolving hidden with
 * currentUser=null because the validation pipeline didn't forward the user.
 * This means context.hidden in custom validators could disagree with what
 * the form UI shows.
 */
export const hiddenCurrentUserTest = defineType({
  name: 'hiddenCurrentUserTest',
  type: 'document',
  title: 'Hidden + currentUser (#12201)',
  description:
    'Reproduction for issue #12201: hidden callback sometimes called without currentUser',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      hidden: (context) => {
        console.group('hidden function called')
        console.log('context', context)
        console.log('.currentUser', context.currentUser)
        // @ts-expect-error .role exists but is not typed in Sanity's CurrentUser type
        const isAdmin = context.currentUser?.role === 'administrator'
        console.log('isAdmin', isAdmin)
        console.groupEnd()
        return !isAdmin
      },
      validation: (rule, context) =>
        rule.custom((value) => {
          console.group('custom validation function called')
          console.log('Name field value', value)
          console.log('context.hidden', context.hidden)
          console.groupEnd()
          return true
        }),
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'description',
    },
    prepare({title, subtitle}) {
      return {
        title: title || 'Hidden + currentUser test',
        subtitle: subtitle || 'Issue #12201 reproduction',
      }
    },
  },
})
