import {InfoOutlineIcon} from '@sanity/icons'
import {validateSlug} from '../../../utils/validateSlug'

export default {
  name: 'article.info',
  title: 'Article (info)',
  type: 'document',
  icon: InfoOutlineIcon,
  fields: [
    // Title
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    // Slug
    {
      name: 'slug',
      type: 'slug',
      options: {source: 'title'},
      validation: validateSlug,
    },
    // Body
    {
      name: 'body',
      title: 'Body',
      type: 'body',
    },
    // SEO
    {
      name: 'seo',
      title: 'SEO',
      type: 'seo.standard',
    },
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
}
