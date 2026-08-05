/**
 * Reproduction schema for https://linear.app/sanity/issue/SAPP-4084
 *
 * Issue: `url`, `number`, and `array` fields crash at render when their
 * `validation` is a two-argument function `(rule, context) => ...`:
 *
 *   Schema type "url"'s `validation` was not run though `inferFromSchema`
 *
 * The single-argument form `(rule) => ...` works. The docs recommend the
 * two-argument form for conditionally hidden fields, but only `string` (and
 * other inputs that never call `getValidationRule`) survive it today.
 *
 * Manual repro:
 * 1. Structure → Inputs → Debug → Two-arg validation repro (SAPP-4084).
 * 2. Create a new document.
 * 3. `url`, `number`, and `array` fields show a red "An error occurred" box.
 * 4. `string` control field renders normally.
 */
import {defineArrayMember, defineField, defineType} from 'sanity'

export const twoArgValidationRepro = defineType({
  name: 'twoArgValidationRepro',
  type: 'document',
  title: 'Two-arg validation repro (SAPP-4084)',
  description: 'url/number/array fields crash when validation uses (rule, context) => ...',
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
        'The url, number, and array fields below use two-argument validation and crash at render. The string control field uses the same pattern but works.',
    }),

    defineField({
      name: 'link',
      type: 'url',
      title: 'URL (two-arg validation — crashes)',
      description:
        'Two-argument validation on url fields triggers getValidationRule during render.',
      validation: (rule, context) =>
        context?.hidden ? rule.skip() : rule.required().uri({scheme: ['https']}),
    }),

    defineField({
      name: 'amount',
      type: 'number',
      title: 'Number (two-arg validation — crashes)',
      description:
        'Two-argument validation on number fields triggers getValidationRule during render.',
      validation: (rule, context) => (context?.hidden ? rule.skip() : rule.required().min(1)),
    }),

    defineField({
      name: 'tags',
      type: 'array',
      title: 'Array (two-arg validation — crashes)',
      description:
        'Two-argument validation on array fields triggers getValidationRule during render.',
      of: [defineArrayMember({type: 'string'})],
      validation: (rule, context) => (context?.hidden ? rule.skip() : rule.required().max(5)),
    }),

    defineField({
      name: 'label',
      type: 'string',
      title: 'String control (two-arg validation — works)',
      description:
        'Same two-argument pattern on string; StringInput never reads validation rules at render.',
      validation: (rule, context) => (context?.hidden ? rule.skip() : rule.required().min(1)),
    }),
  ],
  preview: {
    select: {title: 'title'},
    prepare({title}) {
      return {
        title: title || 'Two-arg validation repro',
        subtitle: 'SAPP-4084',
      }
    },
  },
})
