import {defineField, defineType} from 'sanity'

/**
 * Repro for https://github.com/sanity-io/sanity/issues/13429
 *
 * When an array field with `options.layout: 'tags'` is set to `readOnly: true`,
 * the text inside each tag pill appears left-shifted instead of visually
 * centered. The editable field (identical config, `readOnly: false`) renders
 * the text visually centered because the trailing remove button provides
 * right-side spacing inside the pill.
 *
 * To reproduce: open the studio, create a new document of type
 * `issue13429TagsReadonly`. Both fields are pre-populated with the same
 * initial values via `initialValue` on the document. Compare the two fields
 * side by side — the readOnly field's tag pills show text hugging the left
 * edge, while the editable field's pills show text visually centered.
 */
export const issue13429TagsReadonly = defineType({
  name: 'issue13429TagsReadonly',
  type: 'document',
  title: 'Issue #13429 — tags readOnly padding',
  description:
    'Compare the two array-of-strings fields with options.layout=tags: one editable, ' +
    'one readOnly. Both have the same initial values. The readOnly one shows tag text ' +
    'flush-left; the editable one shows it visually centered.',
  fields: [
    defineField({
      name: 'issue13429ActorsEditable',
      title: 'Actors (editable — text visually centered inside pill)',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'issue13429ActorsReadOnly',
      title: 'Actors (readOnly — text hugs the left edge, this is the bug)',
      type: 'array',
      of: [{type: 'string'}],
      readOnly: true,
      options: {layout: 'tags'},
      validation: (rule) => rule.required().min(1),
    }),
  ],
  initialValue: {
    issue13429ActorsEditable: ['Robert De Niro', 'Al Pacino', 'Joe Pesci'],
    issue13429ActorsReadOnly: ['Robert De Niro', 'Al Pacino', 'Joe Pesci'],
  },
})
