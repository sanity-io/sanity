import {createConfig, defineField, defineType} from 'sanity'
import {deskTool} from 'sanity/desk'

const defaultSchema = {
  name: 'default',
  types: [
    defineType({
      type: 'document',
      name: 'post',
      title: 'Post',
      fields: [
        defineField({
          type: 'string',
          name: 'title',
          title: 'Title',
        }),

        // NOTE: This is not implemented:

        // defineField({
        //   type: 'reference',
        //   name: 'license',
        //   title: 'License',
        //   to: {
        //     type: 'license',
        //     source: 'shared',
        //   },
        // }),
      ],
    }),
  ],
}

const sharedSchema = {
  name: 'shared',
  types: [
    defineType({
      type: 'document',
      name: 'license',
      title: 'License',
      fields: [
        defineField({
          type: 'string',
          name: 'title',
          title: 'Title',
        }),
      ],
    }),
  ],
}

const defaultConfig = createConfig({
  basePath: '/test',
  dataset: 'web-production',
  plugins: [deskTool()],
  name: 'default',
  projectId: 'ppsg7ml5',
  title: 'Sanity.io',
  schema: defaultSchema,

  unstable_sources: [
    {
      name: 'shared',
      projectId: 'ppsg7ml5',
      dataset: 'shared',
      schema: sharedSchema,
    },
  ],
})

const sharedConfig = createConfig({
  basePath: '/shared',
  dataset: 'shared-production',
  plugins: [deskTool()],
  name: 'shared',
  projectId: 'ppsg7ml5',
  title: 'Shared',
  schema: sharedSchema,
})

export default [defaultConfig, sharedConfig]
