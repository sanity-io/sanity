import {defineConfig, defineType, defineField, defineArrayMember} from 'sanity'

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
            name: 'excerpt',
            title: 'Excerpt',
            type: 'text',
            validation: (rule) =>
              rule.required().max(200).error('An excerpt of 200 characters or less is required'),
          }),
          defineField({
            name: 'body',
            title: 'Body',
            type: 'array',
            of: [
              defineArrayMember({
                type: 'block',
              }),
            ],
          }),
        ],
      }),
    ],
  },
})
