// @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
import {defineConfig, defineType, defineField} from 'sanity'

export default defineConfig({
  name: 'default',
  title: 'Blog',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  schema: {
    types: [
      defineType({
        name: 'post',
        title: 'Post',
        type: 'document',
        fields: [
          defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
          }),
          defineField({
            name: 'isExternal',
            title: 'Link to external site?',
            type: 'boolean',
          }),
          defineField({
            name: 'externalUrl',
            title: 'External URL',
            type: 'url',
            // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
            hidden: ({document}) => !document?.isExternal,
          }),
        ],
      }),
    ],
  },
})
