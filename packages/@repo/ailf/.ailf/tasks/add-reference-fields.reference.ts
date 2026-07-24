// @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
import {defineConfig, defineType, defineField, defineArrayMember} from 'sanity'

export default defineConfig({
  name: 'default',
  title: 'Blog',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  schema: {
    types: [
      defineType({
        name: 'author',
        title: 'Author',
        type: 'document',
        fields: [
          defineField({
            name: 'name',
            title: 'Name',
            type: 'string',
          }),
        ],
      }),
      defineType({
        name: 'category',
        title: 'Category',
        type: 'document',
        fields: [
          defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
          }),
        ],
      }),
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
            name: 'author',
            title: 'Author',
            type: 'reference',
            to: [{type: 'author'}],
            // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
            validation: (rule) => rule.required(),
          }),
          defineField({
            name: 'categories',
            title: 'Categories',
            type: 'array',
            of: [
              defineArrayMember({
                type: 'reference',
                to: [{type: 'category'}],
              }),
            ],
            // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
            validation: (rule) => rule.max(3),
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
