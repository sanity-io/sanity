import {DocumentIcon} from '@sanity/icons/Document'
import {defineField, defineType, definePlugin} from 'sanity'

import {FORM_BUILDER_REPRO_TYPE, FormBuilderRepro} from './FormBuilderRepro'

const formBuilderReproSchema = defineType({
  name: FORM_BUILDER_REPRO_TYPE,
  type: 'document',
  title: 'FormBuilder repro doc',
  fields: [
    defineField({name: 'title', type: 'string', title: 'Title'}),
    defineField({name: 'description', type: 'text', title: 'Description'}),
    defineField({
      name: 'tags',
      type: 'array',
      title: 'Tags',
      of: [{type: 'string'}],
    }),
  ],
})

export const formBuilderReproTool = definePlugin(() => ({
  name: 'form-builder-repro',
  schema: {
    types: [formBuilderReproSchema],
  },
  tools: [
    {
      name: 'form-builder-repro',
      title: 'FormBuilder repro',
      icon: DocumentIcon,
      component: FormBuilderRepro,
    },
  ],
}))
