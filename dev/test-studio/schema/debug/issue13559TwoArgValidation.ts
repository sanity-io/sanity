import {defineField, defineType} from 'sanity'

/**
 * Repro for https://github.com/sanity-io/sanity/issues/13559
 *
 * Two-argument validation functions like `(rule, context) => ...` crash the
 * Studio on `url`, `number`, and `array` fields with:
 *
 *   Schema type "<type>"'s validation was not run though `inferFromSchema`
 *
 * `string` fields with the same shape don't reproduce (string inputs don't
 * call `getValidationRule` at render time), included below for contrast.
 *
 * On `main` (pre-fix), the three affected fields render a red "An error
 * occurred" box. With the fix, all three render their normal input controls
 * and the deferred validation still runs at write time.
 */
export const issue13559TwoArgValidation = defineType({
  name: 'issue13559TwoArgValidation',
  type: 'document',
  title: 'Issue #13559 · two-argument validation',
  description:
    'Repro for GH #13559. Fields using `(rule, context) => ...` validation crash on url/number/array on main. String field is included for contrast (does not reproduce).',
  fields: [
    defineField({
      name: 'urlTwoArg',
      title: 'URL — two-arg validation (crashes on main)',
      type: 'url',
      validation: (rule, _context) => rule.required().uri({scheme: ['https']}),
    }),
    defineField({
      name: 'numberTwoArg',
      title: 'Number — two-arg validation (crashes on main)',
      type: 'number',
      validation: (rule, _context) => rule.required().min(1),
    }),
    defineField({
      name: 'arrayTwoArg',
      title: 'Array — two-arg validation (crashes on main)',
      type: 'array',
      of: [{type: 'string'}],
      validation: (rule, _context) => rule.max(3),
    }),
    defineField({
      name: 'stringTwoArg',
      title: 'String — two-arg validation (does not crash, for contrast)',
      type: 'string',
      validation: (rule, _context) => rule.required().min(3),
    }),
  ],
})
