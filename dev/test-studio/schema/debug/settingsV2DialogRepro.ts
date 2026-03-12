import {defineArrayMember, defineField, defineType} from 'sanity'

import {DialogWrappedObjectInput} from './components/DialogWrappedObjectInput'

export const settingsV2NavSettings = defineType({
  type: 'object',
  name: 'settingsV2NavSettings',
  title: 'Navbar Settings',
  fields: [
    defineField({name: 'logoAlt', type: 'string'}),
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      description:
        'Primary repro list. Add many items quickly while editing inside the dialog and watch for vanishing or non-rendered rows.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'navItem',
          title: 'Navbar item',
          fields: [
            defineField({name: 'label', type: 'string'}),
            defineField({name: 'href', type: 'string'}),
            defineField({name: 'isHighlighted', type: 'boolean'}),
            defineField({
              name: 'children',
              title: 'Children',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'navChildItem',
                  fields: [
                    defineField({name: 'label', type: 'string'}),
                    defineField({name: 'href', type: 'string'}),
                  ],
                  preview: {select: {title: 'label', subtitle: 'href'}},
                }),
              ],
            }),
          ],
          preview: {select: {title: 'label', subtitle: 'href'}},
        }),
      ],
    }),
  ],
})

export const settingsV2DialogRepro = defineType({
  type: 'document',
  name: 'settingsV2DialogRepro',
  title: 'Settings v2 dialog repro',
  groups: [
    {name: 'seo', title: 'SEO'},
    {name: 'navbar', title: 'Navbar'},
    {name: 'footer', title: 'Footer'},
  ],
  fields: [
    defineField({
      name: 'language',
      type: 'string',
      readOnly: true,
      hidden: true,
      initialValue: 'en',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'seo',
      type: 'object',
      title: 'SEO',
      group: 'seo',
      validation: (Rule) => Rule.required(),
      fields: [
        defineField({name: 'title', type: 'string', validation: (Rule) => Rule.required()}),
        defineField({name: 'description', type: 'text'}),
      ],
    }),
    defineField({
      name: 'topbarSettings',
      type: 'object',
      title: 'Topbar Settings',
      group: 'navbar',
      validation: (Rule) => Rule.required(),
      description:
        'This is the topbar that appears at the top of the navbar. It is visible on mobile screens only.',
      fields: [
        defineField({name: 'enabled', type: 'boolean'}),
        defineField({name: 'message', type: 'string'}),
        defineField({
          name: 'items',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'topbarItem',
              fields: [
                defineField({name: 'label', type: 'string'}),
                defineField({name: 'href', type: 'string'}),
              ],
              preview: {select: {title: 'label', subtitle: 'href'}},
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'navSettings',
      type: 'settingsV2NavSettings',
      title: 'Navbar Settings',
      group: 'navbar',
      validation: (Rule) => Rule.required(),
      components: {input: DialogWrappedObjectInput},
    }),
    defineField({
      name: 'regionPopupSettings',
      title: 'Region Popup Settings',
      type: 'object',
      group: 'navbar',
      validation: (Rule) => Rule.required(),
      description:
        'This is the region popup that appear when the user is accessing a region outside of their IP region.',
      fields: [
        defineField({name: 'enabled', type: 'boolean'}),
        defineField({name: 'heading', type: 'string'}),
        defineField({name: 'body', type: 'text'}),
        defineField({
          name: 'regions',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'region',
              fields: [
                defineField({name: 'code', type: 'string'}),
                defineField({name: 'label', type: 'string'}),
              ],
              preview: {select: {title: 'label', subtitle: 'code'}},
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'translucentOverridePaths',
      title: 'Translucent Override Paths',
      type: 'array',
      of: [{type: 'string'}],
      group: 'navbar',
      description:
        'List of paths where the navbar appears in light mode. This is useful for pages that have a different navbar style than the default. (e.g. /shop or /my-account)',
    }),
    defineField({
      name: 'legacyFooterSettings',
      title: 'Legacy Footer Settings',
      type: 'object',
      group: 'footer',
      description: 'This is the legacy footer that appears at the bottom of the page.',
      deprecated: {
        reason:
          'Use the new footer settings instead. This field will be removed in a future update.',
      },
      fields: [
        defineField({name: 'title', type: 'string'}),
        defineField({
          name: 'columns',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'footerColumn',
              fields: [
                defineField({name: 'heading', type: 'string'}),
                defineField({
                  name: 'links',
                  type: 'array',
                  of: [
                    defineArrayMember({
                      type: 'object',
                      name: 'footerLink',
                      fields: [
                        defineField({name: 'label', type: 'string'}),
                        defineField({name: 'href', type: 'string'}),
                      ],
                      preview: {select: {title: 'label', subtitle: 'href'}},
                    }),
                  ],
                }),
              ],
              preview: {select: {title: 'heading'}},
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      language: 'language',
    },
    prepare({language}) {
      return {
        title: `Website Settings for (${language || 'unknown'})`,
      }
    },
  },
})
