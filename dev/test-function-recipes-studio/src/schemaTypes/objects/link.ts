import {defineField, defineType} from 'sanity'
import {LinkIcon} from '@sanity/icons'

/**
 * Link schema object. This link object lets the user first select the type of link and then
 * then enter the URL, page reference, or post reference - depending on the type selected.
 * Learn more: https://www.sanity.io/docs/object-type
 */

export const link = defineType({
  name: 'link',
  title: 'Link',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'linkType',
      title: 'Link Type',
      type: 'string',
      initialValue: 'url',
      options: {
        list: [
          {title: 'URL', value: 'href'},
          {title: 'Page', value: 'page'},
          {title: 'Post', value: 'post'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'href',
      title: 'URL',
      type: 'url',
      hidden: ({parent}) => parent?.linkType !== 'href',
      validation: (Rule) =>
        // Custom validation to ensure URL is provided if the link type is 'href'
        Rule.custom((value, context: any) => {
          if (context.parent?.linkType === 'href' && !value) {
            return 'URL is required when Link Type is URL'
          }
          return true
        }),
    }),
    defineField({
      name: 'page',
      title: 'Page',
      type: 'reference',
      to: [{type: 'page'}],
      hidden: ({parent}) => parent?.linkType !== 'page',
      validation: (Rule) =>
        // Custom validation to ensure page reference is provided if the link type is 'page'
        Rule.custom((value, context: any) => {
          if (context.parent?.linkType === 'page' && !value) {
            return 'Page reference is required when Link Type is Page'
          }
          return true
        }),
    }),
    defineField({
      name: 'post',
      title: 'Post',
      type: 'reference',
      to: [{type: 'post'}],
      hidden: ({parent}) => parent?.linkType !== 'post',
      validation: (Rule) =>
        // Custom validation to ensure post reference is provided if the link type is 'post'
        Rule.custom((value, context: any) => {
          if (context.parent?.linkType === 'post' && !value) {
            return 'Post reference is required when Link Type is Post'
          }
          return true
        }),
    }),
    defineField({
      name: 'openInNewTab',
      title: 'Open in new tab',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})
