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
            name: 'coverImage',
            title: 'Cover image',
            type: 'image',
          }),
          defineField({
            name: 'author',
            title: 'Author',
            type: 'reference',
            to: [{type: 'author'}],
          }),
        ],
        preview: {
          select: {
            title: 'title',
            authorName: 'author.name',
            media: 'coverImage',
          },
          // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
          prepare({title, authorName, media}) {
            return {
              title,
              subtitle: authorName,
              media,
            }
          },
        },
      }),
    ],
  },
})
