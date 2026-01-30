import {DesktopIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

/**
 * Test document type for verifying DocumentLocation resolver features.
 * Used to test the `icon` and `showHref` properties on location entries.
 */
export const locationResolverTest = defineType({
  name: 'locationResolverTest',
  title: 'Location Resolver Test',
  type: 'document',
  icon: DesktopIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
      },
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      slug: 'slug.current',
    },
    prepare({title, slug}) {
      return {
        title: title || 'Untitled',
        subtitle: slug ? `/${slug}` : 'No slug',
      }
    },
  },
})
