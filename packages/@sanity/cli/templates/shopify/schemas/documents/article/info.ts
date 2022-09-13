import {InfoOutlineIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'
import {validateSlug} from '../../../utils/validateSlug'

export default defineType({
  name: 'article.info',
  title: 'Article (info)',
  type: 'document',
  icon: InfoOutlineIcon,
  fields: [
    // Title
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
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
