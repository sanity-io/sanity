import {defineField, defineType} from 'sanity'
import {
  BulbOutlineIcon,
  ComposeSparklesIcon,
  LinkIcon,
  ImageIcon,
  ControlsIcon,
} from '@sanity/icons'

/**
 * Call to action schema object.  Objects are reusable schema structures document.
 * Learn more: https://www.sanity.io/docs/object-type
 */

export const callToAction = defineType({
  name: 'callToAction',
  title: 'Call to Action',
  type: 'object',
  icon: BulbOutlineIcon,
  groups: [
    {
      name: 'contents',
      icon: ComposeSparklesIcon,
      default: true,
    },
    {
      name: 'media',
      icon: ImageIcon,
    },
    {
      name: 'button',
      icon: LinkIcon,
    },
    {
      name: 'designSystem',
      icon: ControlsIcon,
    },
  ],
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      group: 'contents',
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      validation: (Rule) => Rule.required(),
      group: 'contents',
    }),
    defineField({
      name: 'body',
      type: 'blockContentTextOnly',
      group: 'contents',
    }),
    defineField({
      name: 'button',
      type: 'button',
      group: 'button',
    }),
    defineField({
      name: 'image',
      type: 'image',
      group: 'media',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'theme',
      type: 'string',
      title: 'Theme',
      options: {
        list: [
          {title: 'Light', value: 'light'},
          {title: 'Dark', value: 'dark'},
        ],
        layout: 'radio',
      },
      description: 'Use dark theme with white tile grid background',
      initialValue: 'light',
      group: 'designSystem',
    }),
    defineField({
      name: 'contentAlignment',
      title: 'Content Order',
      type: 'string',
      initialValue: 'textFirst',
      description: 'Does text content or image come first?',
      options: {
        list: [
          {title: 'Text then Image', value: 'textFirst'},
          {title: 'Image then Text', value: 'imageFirst'},
        ],
        layout: 'radio',
      },
      hidden: ({parent}) => !parent?.image?.asset,
      group: 'designSystem',
    }),
  ],
  preview: {
    select: {
      title: 'heading',
      image: 'image.asset',
    },
    prepare(selection) {
      const {title, image} = selection
      return {
        title: title,
        subtitle: 'Call to Action',
        media: image || undefined,
      }
    },
  },
})
