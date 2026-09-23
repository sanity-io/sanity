import {type Config, defineField, defineType} from 'sanity'
import {structureTool} from 'sanity/structure'

import {
  WrappedAnnotation,
  WrappedBlock,
  WrappedField,
  WrappedInlineBlock,
  WrappedInput,
  WrappedItem,
  WrappedPreview,
} from '../components/wrappedForm'

/**
 * The "customer wraps every slot" pattern: config-level form.components
 * apply workspace-wide, which this per-scenario workspace makes exact.
 * Included only by the customization build's config
 * (studio-customizations/sanity.config.ts,
 * via `pnpm --filter bench build:customizations`) — never by
 * ../sanity.config.ts, so the pristine dist stays untouched.
 */

const wrappedForm = defineType({
  name: 'wrappedForm',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({name: 'description', type: 'text'}),
    defineField({
      name: 'tags',
      type: 'array',
      of: [{type: 'object', fields: [defineField({name: 'label', type: 'string'})]}],
    }),
    defineField({name: 'body', type: 'array', of: [{type: 'block'}]}),
  ],
})

export const wrappedFormWorkspace = {
  name: 'wrapped-form-bench',
  plugins: [structureTool()],
  form: {
    components: {
      input: WrappedInput,
      field: WrappedField,
      item: WrappedItem,
      block: WrappedBlock,
      inlineBlock: WrappedInlineBlock,
      annotation: WrappedAnnotation,
      preview: WrappedPreview,
    },
  },
  schema: {types: [wrappedForm]},
} satisfies Partial<Config>
