import {CogIcon, FolderIcon} from '@sanity/icons'

const TITLE = 'Settings'

export default {
  name: 'settings',
  title: TITLE,
  type: 'document',
  icon: CogIcon,
  fields: [
    // Menu
    {
      name: 'menu',
      title: 'Menu',
      type: 'object',
      options: {
        collapsed: false,
        collapsible: true,
      },
      fields: [
        // Links
        {
          name: 'links',
          title: 'Links',
          type: 'array',
          of: [
            {
              title: 'Group',
              name: 'linkGroup',
              type: 'object',
              icon: FolderIcon,
              fields: [
                {
                  title: 'Title',
                  name: 'title',
                  type: 'string',
                  validation: (Rule) => Rule.required(),
                },
                {
                  title: 'Links',
                  name: 'links',
                  type: 'array',
                  of: [{type: 'linkInternal'}, {type: 'linkExternal'}],
                },
              ],
            },
            {type: 'linkInternal'},
            {type: 'linkExternal'},
          ],
        },
      ],
    },
    // Footer
    {
      name: 'footer',
      title: 'Footer',
      type: 'object',
      options: {
        collapsed: false,
        collapsible: true,
      },
      fields: [
        // Links
        {
          name: 'links',
          title: 'Links',
          type: 'array',
          of: [{type: 'linkInternal'}, {type: 'linkExternal'}],
        },
        // Text
        {
          name: 'text',
          title: 'Text',
          type: 'array',
          of: [
            {
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
            },
          ],
        },
      ],
    },
    // SEO
    {
      name: 'seo',
      title: 'SEO',
      type: 'object',
      options: {
        collapsed: false,
        collapsible: true,
      },
      fields: [
        {
          name: 'title',
          title: 'Site title',
          type: 'string',
          description: 'Displayed on all pages',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'image',
          title: 'Image',
          type: 'image',
          description: 'Fallback displayed on pages with no SEO image defined',
        },
      ],
      validation: (Rule) => Rule.required(),
    },
  ],
  preview: {
    prepare() {
      return {
        title: TITLE,
      }
    },
  },
}
