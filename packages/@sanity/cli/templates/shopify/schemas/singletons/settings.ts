import {CogIcon, FolderIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

const TITLE = 'Settings'

export default defineType({
  name: 'settings',
  title: TITLE,
  type: 'document',
  icon: CogIcon,
  fields: [
    // Menu
    defineField({
      name: 'menu',
      title: 'Menu',
      type: 'object',
      options: {
        collapsed: false,
        collapsible: true,
      },
      fields: [
        // Links
        defineField({
          name: 'links',
          title: 'Links',
          type: 'array',
          of: [
            defineArrayMember({
              title: 'Group',
              name: 'linkGroup',
              type: 'object',
              icon: FolderIcon,
              fields: [
                defineField({
                  title: 'Title',
                  name: 'title',
                  type: 'string',
                  validation: (Rule) => Rule.required(),
                }),
                defineField({
                  title: 'Links',
                  name: 'links',
                  type: 'array',
                  of: [
                    defineArrayMember({type: 'linkInternal'}),
                    defineArrayMember({type: 'linkExternal'}),
                  ],
                }),
              ],
            }),
            defineArrayMember({type: 'linkInternal'}),
            defineArrayMember({type: 'linkExternal'}),
          ],
        }),
      ],
    }),
    // Footer
    defineField({
      name: 'footer',
      title: 'Footer',
      type: 'object',
      options: {
        collapsed: false,
        collapsible: true,
      },
      fields: [
        // Links
        defineField({
          name: 'links',
          title: 'Links',
          type: 'array',
          of: [{type: 'linkInternal'}, {type: 'linkExternal'}],
        }),
        // Text
        defineField({
          name: 'text',
          title: 'Text',
          type: 'array',
          of: [
            defineArrayMember({
              lists: [],
              marks: {
                annotations: [
                  // Email
                  {
                    title: 'Email',
                    name: 'annotationLinkEmail',
                    type: 'annotationLinkEmail',
                  },
                  // Internal link
                  {
                    title: 'Internal page',
                    name: 'annotationLinkInternal',
                    type: 'annotationLinkInternal',
                  },
                  // URL
                  {
                    title: 'URL',
                    name: 'annotationLinkExternal',
                    type: 'annotationLinkExternal',
                  },
                ],
                decorators: [],
              },
              // Block styles
              styles: [{title: 'Normal', value: 'normal'}],
              type: 'block',
            }),
          ],
        }),
      ],
    }),
    // SEO
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      options: {
        collapsed: false,
        collapsible: true,
      },
      fields: [
        defineField({
          name: 'title',
          title: 'Site title',
          type: 'string',
          description: 'Displayed on all pages',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'image',
          title: 'Image',
          type: 'image',
          description: 'Fallback displayed on pages with no SEO image defined',
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    prepare() {
      return {
        title: TITLE,
      }
    },
  },
})
