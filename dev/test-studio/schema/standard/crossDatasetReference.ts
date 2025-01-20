import {BookIcon, MoonIcon, UserIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const crossDatasetSubtype = defineType({
  type: 'crossDatasetReference',
  name: 'crossDatasetSubtype',
  title: 'Subtype of cross dataset references',
  dataset: 'playground',
  to: [
    {
      type: 'book',
      icon: BookIcon,
      preview: {
        select: {
          title: 'title',
          media: 'coverImage',
        },
        prepare(val) {
          return {
            title: val.title,
            media: val.coverImage,
          }
        },
      },
    },
  ],
})

export default defineType({
  name: 'crossDatasetReferenceTest',
  type: 'document',
  title: 'Cross dataset reference test',
  description: 'Test cases for cross dataset references',
  icon: MoonIcon,
  fields: [
    {name: 'title', type: 'string'},
    {
      name: 'bookInPlayground',
      title: 'Reference to book in the "playground" dataset',
      type: 'crossDatasetReference',
      dataset: 'playground',
      studioUrl: ({id, type}) => {
        return type
          ? `${document.location.protocol}//${document.location.host}/playground/content/${type};${id}`
          : null
      },
      to: [
        {
          type: 'book',
          icon: BookIcon,
          preview: {
            select: {
              title: 'title',
              subtitle: 'descriptionMd',
              media: 'coverImage',
            },
            prepare(val) {
              return {
                title: val.title,
                subtitle: val.subtitle,
                media: val.coverImage,
              }
            },
          },
        },
      ],
    },
    {
      title: 'Reference to book or author in the "playground" dataset',
      name: 'bookOrAuthorInPlayground',
      type: 'crossDatasetReference',
      dataset: 'playground',
      studioUrl: ({id, type}) => {
        return type
          ? `${document.location.protocol}//${document.location.host}/playground/content/${type};${id}`
          : null
      },
      to: [
        {
          type: 'book',
          icon: BookIcon,
          preview: {
            select: {
              title: 'title',
              subtitle: 'descriptionMd',
              coverImage: 'coverImage',
            },
            prepare(val) {
              return {
                title: val.title,
                subtitle: val.subtitle,
                media: val.coverImage,
              }
            },
          },
        },
        {
          type: 'author',
          icon: UserIcon,
          preview: {
            select: {
              title: 'name',
            },
            prepare(val) {
              return {
                title: val.title,
                media: val.media,
              }
            },
          },
        },
      ],
    },
    {
      title: 'Reference to book or author in the "playground-partial-indexing" dataset',
      name: 'bookOrAuthorInPlaygroundWithPartialIndexing',
      type: 'crossDatasetReference',
      dataset: 'playground-partial-indexing',
      studioUrl: ({id, type}) => {
        return type
          ? `${document.location.protocol}//${document.location.host}/playground-partial-indexing/structure/${type};${id}`
          : null
      },
      to: [
        {
          type: 'book',
          icon: BookIcon,
          preview: {
            select: {
              title: 'title',
              // subtitle: 'descriptionMd',
              subtitle: 'translations.no',
              coverImage: 'coverImage',
            },
            prepare(val) {
              return {
                title: val.title,
                subtitle: val.subtitle,
                media: val.coverImage,
              }
            },
          },
        },
        {
          type: 'author',
          icon: UserIcon,
          preview: {
            select: {
              title: 'name',
            },
            prepare(val) {
              return {
                title: val.title,
                media: val.media,
              }
            },
          },
        },
      ],
    },
    {
      title:
        'Cross dataset reference with custom filter, only returning books with a norwegian title',
      description: 'Repro case for https://linear.app/sanity/issue/SDX-1367',
      name: 'bookWithTitle',
      type: 'crossDatasetReference',
      dataset: 'playground',
      studioUrl: ({id, type}) => {
        return type
          ? `${document.location.protocol}//${document.location.host}/playground/structure/${type};${id}`
          : null
      },
      options: {
        filter: `defined(translations.no)`,
      },
      to: [
        {
          type: 'book',
          icon: BookIcon,
          preview: {
            select: {
              title: 'translations.no',
            },
          },
        },
      ],
    },
    defineField({
      title: 'Cross Dataset reference in PTE',
      name: 'portableText',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          of: [
            // This array member was added in order to replicate the issue reported in CRX-981,
            // in which inline Cross Dataset References added to Portable Text blocks cause a
            // runtime error. It intentionally **does not use** the `crossDatasetSubtype` aliased
            // type, because aliased types do not provoke this error.
            defineArrayMember({
              type: 'crossDatasetReference',
              name: 'crossDatasetReferenceInline',
              title: 'Inline Cross Dataset Reference',
              dataset: 'playground',
              to: [
                {
                  type: 'book',
                  icon: BookIcon,
                  preview: {
                    select: {
                      title: 'title',
                      media: 'coverImage',
                    },
                    prepare(val) {
                      return {
                        title: val.title,
                        media: val.coverImage,
                      }
                    },
                  },
                },
              ],
            }),
          ],
        }),
        {
          title: 'Cross Dataset reference subtype test',
          name: 'crossDatasetSubtype',
          type: 'crossDatasetSubtype',
        },
      ],
    }),
    {
      title: 'Cross Dataset reference in array',
      name: 'array',
      type: 'array',
      of: [
        {
          title: 'Cross Dataset reference subtype test',
          name: 'crossDatasetSubtype',
          type: 'crossDatasetSubtype',
        },
      ],
    },
    {
      title: 'Cross Dataset reference subtype test',
      name: 'crossDatasetSubtype',
      type: 'crossDatasetSubtype',
    },
    {
      name: 'initialValueTest',
      type: 'crossDatasetReference',
      dataset: 'playground',
      studioUrl: ({id, type}) => {
        return type
          ? `${document.location.protocol}//${document.location.host}/playground/content/${type};${id}`
          : null
      },
      to: [
        {
          type: 'book',
          icon: BookIcon,
          preview: {
            select: {
              title: 'title',
              subtitle: 'descriptionMd',
              media: 'coverImage',
            },
            prepare(val) {
              return {
                title: val.title,
                subtitle: val.subtitle,
                media: val.coverImage,
              }
            },
          },
        },
      ],
      initialValue: () => ({
        _type: 'crossDatasetReference',
        _ref: '4203c6bd-98c2-418e-9558-3ed56ebaf1d8',
        _dataset: 'playground',
        _projectId: 'ppsg7ml5',
      }),
    },
  ],
  preview: {
    select: {
      title: 'title',
      authorRefName: 'bookOrAuthorInPlayground.name',
      authorBff: 'bookOrAuthorInPlayground.bestFriend.name',
      bookRefTitle: 'bookOrAuthorInPlayground.title',
    },
    prepare(values) {
      return {
        title: values.title,
        subtitle: [
          values.authorRefName
            ? `Author: ${values.authorRefName} (${`Bff: ${values.authorBff || 'none'}`})`
            : '',
          values.bookRefTitle ? `Book title: ${values.bookRefTitle}` : '',
        ]
          .filter(Boolean)
          .join(', '),
      }
    },
  },
})
