import {defineConfig, defineField, defineType} from 'sanity'

export default defineConfig({
  projectId: import.meta.env.VITE_PERF_EFPS_PROJECT_ID,
  dataset: import.meta.env.VITE_PERF_EFPS_DATASET,
  schema: {
    types: [
      defineType({
        name: 'blockContent',
        type: 'array',
        of: [{type: 'block'}, {type: 'image'}, {type: 'columns'}, {type: 'hero'}],
      }),
      defineType({
        name: 'columns',
        type: 'object',
        fields: [
          defineField({
            name: 'columns',
            type: 'array',
            of: [
              {
                type: 'object',
                fields: [
                  defineField({name: 'title', type: 'string'}),
                  defineField({name: 'content', type: 'blockContent'}),
                ],
              },
            ],
          }),
        ],
      }),
      defineType({
        name: 'hero',
        type: 'object',
        fields: [
          defineField({name: 'image', type: 'image'}),
          defineField({name: 'body', type: 'blockContent'}),
        ],
      }),
      defineType({
        name: 'seo',
        type: 'object',
        fields: [
          defineField({
            name: 'slug',
            type: 'slug',
            description:
              'Defines the part of the URL that uniquely defines this entity from others.',
            validation: (rule) => rule.required(),
          }),
          defineField({name: 'metaTitle', type: 'string'}),
          defineField({name: 'metaDescription', type: 'text'}),
          defineField({name: 'excludeFromSearchEngines', type: 'boolean'}),
        ],
      }),
      defineType({
        name: 'article',
        type: 'document',
        fields: [
          defineField({name: 'title', type: 'string'}),
          defineField({name: 'description', type: 'string'}),
          defineField({name: 'mainImage', type: 'image'}),
          defineField({name: 'author', type: 'reference', to: [{type: 'author'}]}),
          defineField({name: 'body', type: 'blockContent'}),
          defineField({name: 'excerpt', type: 'blockContent'}),
          defineField({
            name: 'categories',
            type: 'array',
            of: [{type: 'reference', to: [{type: 'category'}]}],
          }),
          defineField({name: 'tags', type: 'array', of: [{type: 'string'}]}),
          defineField({name: 'seo', title: 'SEO Fields', type: 'seo'}),
        ],
      }),
      defineType({
        name: 'author',
        type: 'document',
        fields: [
          defineField({name: 'name', type: 'string'}),
          defineField({name: 'profilePicture', type: 'image'}),
          defineField({name: 'bio', type: 'blockContent'}),
        ],
      }),
      defineType({
        name: 'category',
        type: 'document',
        fields: [
          defineField({name: 'name', type: 'string'}),
          defineField({name: 'image', type: 'image'}),
        ],
      }),
    ],
  },
})
