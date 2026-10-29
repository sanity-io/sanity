/**
 * Reproduction schema for https://linear.app/sanity/issue/SAPP-4084
 * and the customer report in https://linear.app/sanity/issue/SAPP-3960
 *
 * Used to crash: `url`, `number`, and `array` fields threw at render when
 * `validation` was a two-argument function `(rule, context) => ...`:
 *
 *   Schema type "url"'s `validation` was not run though `inferFromSchema`
 *
 * Fixed in #13878 (sanity@6.9.1). Keep this type to manually confirm
 * two-arg validation still renders, and that skip/required + hidden on url
 * matches string (SAPP-3960).
 *
 * Manual check:
 * 1. Structure → Inputs → Debug → Two-arg validation repro.
 * 2. Create a new document — url/number/array should render as inputs.
 * 3. Toggle "Hide fields" — the skip/required url and string fields hide
 *    and should not fail required validation.
 */
import {defineArrayMember, defineField, defineType} from 'sanity'

export const twoArgValidationRepro = defineType({
  name: 'twoArgValidationRepro',
  type: 'document',
  title: 'Two-arg validation repro (SAPP-4084 / SAPP-3960)',
  description: 'url/number/array fields used to crash when validation uses (rule, context) => ...',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      initialValue: 'Two-arg validation repro',
    }),

    defineField({
      name: 'instructions',
      type: 'text',
      title: 'How to reproduce',
      readOnly: true,
      initialValue:
        'The url, number, and array fields below use two-argument validation and used to crash at render. Toggle Hide fields to exercise skip/required on url vs string (SAPP-3960).',
    }),

    defineField({
      name: 'hideFields',
      type: 'boolean',
      title: 'Hide fields',
      description:
        'When true, the skip/required url and string fields below should hide and skip validation (SAPP-3960).',
      initialValue: false,
    }),

    defineField({
      name: 'link',
      type: 'url',
      title: 'URL (two-arg validation)',
      description:
        'Two-argument validation on url fields used to crash getValidationRule during render.',
      validation: (rule, context) =>
        context?.hidden ? rule.skip() : rule.required().uri({scheme: ['https']}),
    }),

    defineField({
      name: 'conditionalUrl',
      type: 'url',
      title: 'URL skip/required (SAPP-3960)',
      description:
        'Exact customer pattern: two-arg skip/required plus hidden. Used to throw inferFromSchema.',
      hidden: ({parent}) => parent?.hideFields === true,
      validation: (rule, context) => (context?.hidden ? rule.skip() : rule.required()),
    }),

    defineField({
      name: 'amount',
      type: 'number',
      title: 'Number (two-arg validation)',
      description:
        'Two-argument validation on number fields triggers getValidationRule during render.',
      validation: (rule, context) => (context?.hidden ? rule.skip() : rule.required().min(1)),
    }),

    defineField({
      name: 'tags',
      type: 'array',
      title: 'Array (two-arg validation)',
      description:
        'Two-argument validation on array fields triggers getValidationRule during render.',
      of: [defineArrayMember({type: 'string'})],
      validation: (rule, context) => (context?.hidden ? rule.skip() : rule.required().max(5)),
    }),

    defineField({
      name: 'label',
      type: 'string',
      title: 'String skip/required (SAPP-3960 control)',
      description: 'Same skip/required + hidden pattern on string, which never crashed at render.',
      hidden: ({parent}) => parent?.hideFields === true,
      validation: (rule, context) => (context?.hidden ? rule.skip() : rule.required().min(1)),
    }),
  ],
  preview: {
    select: {title: 'title'},
    prepare({title}) {
      return {
        title: title || 'Two-arg validation repro',
        subtitle: 'SAPP-4084 / SAPP-3960',
      }
    },
  },
})
