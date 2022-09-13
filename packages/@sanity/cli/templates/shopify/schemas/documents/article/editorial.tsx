import {BookIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'
import {validateSlug} from '../../../utils/validateSlug'

export default defineType({
  name: 'article.editorial',
  title: 'Article (editorial)',
  type: 'document',
  icon: BookIcon,
  fields: [
    // Title
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Title displayed in browser tab / search engine results',
      validation: (Rule) => Rule.required(),
    }),
    // Slug
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title'},
      validation: validateSlug,
    }),
    // Body
    defineField({
      name: 'body',
      title: 'Body',
      type: 'body',
    }),
    // SEO
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo.standard',
    }),
  ],
  preview: {
    select: {
      active: 'active',
      thumbnail: 'thumbnail',
      title: 'title',
    },
    prepare(selection) {
      const {thumbnail, title} = selection

      return {
        media: thumbnail,
        title,
      }
    },
  },
})
