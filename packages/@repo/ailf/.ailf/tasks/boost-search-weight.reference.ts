// @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
import {defineConfig, defineType, defineField, defineArrayMember} from 'sanity'

export default defineConfig({
  name: 'default',
  title: 'Book store',
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
            options: {
              search: {
                weight: 31,
              },
            },
          }),
          defineField({
            name: 'biography',
            title: 'Biography',
            type: 'array',
            of: [
              defineArrayMember({
                type: 'block',
              }),
            ],
          }),
        ],
      }),
      defineType({
        name: 'book',
        title: 'Book',
        type: 'document',
        fields: [
          defineField({
            name: 'name',
            title: 'Name',
            type: 'string',
            options: {
              search: {
                weight: 30,
              },
            },
          }),
          defineField({
            name: 'synopsis',
            title: 'Synopsis',
            type: 'array',
            of: [
              defineArrayMember({
                type: 'block',
              }),
            ],
            options: {
              search: {
                weight: 20,
              },
            },
          }),
        ],
      }),
    ],
  },
})
