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
            name: 'body',
            title: 'Body',
            type: 'array',
            of: [
              defineArrayMember({
                type: 'block',
                styles: [
                  {title: 'Normal', value: 'normal'},
                  {title: 'H2', value: 'h2'},
                ],
                lists: [{title: 'Bullet', value: 'bullet'}],
                marks: {
                  decorators: [
                    {title: 'Strong', value: 'strong'},
                    {title: 'Emphasis', value: 'em'},
                  ],
                  annotations: [
                    defineArrayMember({
                      name: 'link',
                      title: 'Link',
                      type: 'object',
                      fields: [
                        defineField({
                          name: 'href',
                          title: 'URL',
                          type: 'url',
                        }),
                      ],
                    }),
                  ],
                },
              }),
            ],
          }),
        ],
      }),
    ],
  },
})
